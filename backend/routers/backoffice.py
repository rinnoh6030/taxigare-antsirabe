from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlmodel import Session, select

from database import get_session
from models import (
    PAIEMENT_PAYE,
    PAIEMENT_REMBOURSE,
    Gare,
    Reservation,
    Responsable,
    Vehicule,
    RESERVATION_ANNULE,
    RESERVATION_EMBARQUE,
    VEHICULE_ANNULE,
    VEHICULE_EN_ATTENTE,
    VEHICULE_PARTI,
    utcnow,
)
from schemas import (
    AnnulationRequest,
    DepartRequest,
    OccupationUpdate,
    VehiculeCreate,
    VehiculeUpdate,
)
from security import get_current_responsable
from serializers import (
    places_reservees,
    serialize_reservation,
    serialize_vehicule,
)

router = APIRouter(prefix="/api/backoffice", tags=["Back-office"])

JOURS_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]


@router.get("/notifications")
def lister_notifications(
    limite: int = Query(default=20, ge=1, le=100),
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> list[dict]:
    reservations = session.exec(
        select(Reservation)
        .join(Vehicule, Reservation.vehicule_id == Vehicule.id)
        .where(Vehicule.gare_id == responsable.gare_id)
        .order_by(Reservation.created_at.desc())
        .limit(limite)
    ).all()
    return [
        serialize_reservation(session, reservation)
        for reservation in reservations
    ]


@router.get("/statistiques")
def statistiques_gare(
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> dict:
    debut = date.today()
    fin = debut + timedelta(days=6)
    gare = session.get(Gare, responsable.gare_id)

    vehicules = session.exec(
        select(Vehicule).where(
            Vehicule.gare_id == responsable.gare_id,
            Vehicule.date_depart >= debut,
            Vehicule.date_depart <= fin,
            Vehicule.statut != VEHICULE_ANNULE,
        )
    ).all()

    taux_par_jour: dict[date, list[int]] = {}
    for vehicule in vehicules:
        donnees = serialize_vehicule(session, vehicule, gare)
        taux_par_jour.setdefault(vehicule.date_depart, []).append(
            donnees["taux_remplissage"]
        )

    remplissage_semaine = []
    for decalage in range(7):
        jour = debut + timedelta(days=decalage)
        taux = taux_par_jour.get(jour, [])
        remplissage_semaine.append(
            {
                "date": jour.isoformat(),
                "label": f"{JOURS_COURTS[jour.weekday()]} {jour.day:02d}",
                "taux": round(sum(taux) / len(taux)) if taux else 0,
            }
        )

    lignes = session.exec(
        select(
            Vehicule.destination,
            func.coalesce(func.sum(Reservation.nombre_places), 0),
        )
        .join(Reservation, Reservation.vehicule_id == Vehicule.id)
        .where(
            Vehicule.gare_id == responsable.gare_id,
            Vehicule.date_depart >= debut,
            Vehicule.date_depart <= fin,
            Reservation.statut != RESERVATION_ANNULE,
        )
        .group_by(Vehicule.destination)
        .order_by(
            func.coalesce(func.sum(Reservation.nombre_places), 0).desc()
        )
        .limit(6)
    ).all()

    return {
        "periode": {"debut": debut.isoformat(), "fin": fin.isoformat()},
        "remplissage_semaine": remplissage_semaine,
        "destinations_populaires": [
            {"destination": destination, "passagers": int(total or 0)}
            for destination, total in lignes
        ],
    }


def _vehicule_de_la_gare(
    session: Session,
    vehicule_id: int,
    responsable: Responsable,
) -> Vehicule:
    vehicule = session.get(Vehicule, vehicule_id)
    if vehicule is None:
        raise HTTPException(status_code=404, detail="Véhicule introuvable.")
    if vehicule.gare_id != responsable.gare_id:
        raise HTTPException(
            status_code=403,
            detail="Ce véhicule n'appartient pas à votre gare.",
        )
    return vehicule


@router.get("/vehicules")
def lister_vehicules(
    date_filtre: date | None = Query(default=None, alias="date"),
    statut_filtre: str | None = Query(default=None, alias="statut"),
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> list[dict]:
    requete = select(Vehicule).where(Vehicule.gare_id == responsable.gare_id)
    if date_filtre is not None:
        requete = requete.where(Vehicule.date_depart == date_filtre)
    if statut_filtre:
        requete = requete.where(Vehicule.statut == statut_filtre)
    requete = requete.order_by(
        Vehicule.date_depart,
        Vehicule.heure_depart,
        Vehicule.destination,
    )
    vehicules = session.exec(requete).all()
    gare = session.get(Gare, responsable.gare_id)
    return [serialize_vehicule(session, vehicule, gare) for vehicule in vehicules]


@router.get("/vehicules/{vehicule_id}")
def detail_vehicule(
    vehicule_id: int,
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> dict:
    vehicule = _vehicule_de_la_gare(session, vehicule_id, responsable)
    gare = session.get(Gare, responsable.gare_id)
    return serialize_vehicule(session, vehicule, gare)


@router.get("/vehicules/{vehicule_id}/reservations")
def reservations_du_vehicule(
    vehicule_id: int,
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> list[dict]:
    _vehicule_de_la_gare(session, vehicule_id, responsable)
    reservations = session.exec(
        select(Reservation)
        .where(Reservation.vehicule_id == vehicule_id)
        .order_by(Reservation.created_at)
    ).all()
    return [
        serialize_reservation(session, reservation)
        for reservation in reservations
    ]


def _reservation_de_la_gare(
    session: Session,
    reservation_id: int,
    responsable: Responsable,
) -> tuple[Reservation, Vehicule]:
    reservation = session.get(Reservation, reservation_id)
    if reservation is None:
        raise HTTPException(status_code=404, detail="Réservation introuvable.")
    vehicule = _vehicule_de_la_gare(
        session, reservation.vehicule_id, responsable
    )
    return reservation, vehicule


@router.post("/reservations/{reservation_id}/annuler")
def annuler_reservation(
    reservation_id: int,
    donnees: AnnulationRequest,
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> dict:
    reservation, vehicule = _reservation_de_la_gare(
        session, reservation_id, responsable
    )
    if reservation.statut == RESERVATION_ANNULE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette réservation est déjà annulée.",
        )
    if reservation.statut == RESERVATION_EMBARQUE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Impossible d'annuler un billet déjà utilisé.",
        )
    if vehicule.statut == VEHICULE_PARTI:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Le départ a déjà été effectué.",
        )
    if vehicule.statut == VEHICULE_ANNULE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Le départ associé est déjà annulé.",
        )

    motif = (
        donnees.motif.strip()
        if donnees.motif and donnees.motif.strip()
        else "Annulation demandée par le passager"
    )
    rembourse = reservation.payment_status == PAIEMENT_PAYE
    reservation.statut = RESERVATION_ANNULE
    reservation.annule_le = utcnow()
    reservation.motif_annulation = motif
    if rembourse:
        reservation.payment_status = PAIEMENT_REMBOURSE
    session.add(reservation)
    session.commit()
    session.refresh(reservation)

    return {
        "message": (
            "Réservation annulée. La ou les places sont de nouveau disponibles."
            + (" Le paiement sera remboursé." if rembourse else "")
        ),
        "reservation": serialize_reservation(session, reservation),
    }


@router.post("/vehicules", status_code=status.HTTP_201_CREATED)
def ajouter_vehicule(
    donnees: VehiculeCreate,
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> dict:
    vehicule = Vehicule(
        gare_id=responsable.gare_id,
        matricule=donnees.matricule,
        destination=donnees.destination,
        chauffeur=donnees.chauffeur,
        capacite=donnees.capacite,
        date_depart=donnees.date_depart,
        heure_depart=donnees.heure_depart,
        prix=donnees.prix,
        duree_minutes=donnees.duree_minutes,
        statut=VEHICULE_EN_ATTENTE,
    )
    session.add(vehicule)
    session.commit()
    session.refresh(vehicule)
    gare = session.get(Gare, responsable.gare_id)
    return serialize_vehicule(session, vehicule, gare)


@router.patch("/vehicules/{vehicule_id}")
def modifier_vehicule(
    vehicule_id: int,
    donnees: VehiculeUpdate,
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> dict:
    vehicule = _vehicule_de_la_gare(session, vehicule_id, responsable)
    if vehicule.statut != VEHICULE_EN_ATTENTE:
        raise HTTPException(
            status_code=409,
            detail="Seul un départ en attente peut être modifié.",
        )

    modifications = donnees.model_dump(exclude_unset=True)
    reservees = places_reservees(session, vehicule.id)
    nouvelle_capacite = modifications.get("capacite", vehicule.capacite)
    if reservees > nouvelle_capacite:
        raise HTTPException(
            status_code=409,
            detail=(
                f"La capacité ne peut pas être inférieure aux {reservees} "
                "places déjà réservées."
            ),
        )
    if (
        vehicule.passagers_a_bord is not None
        and vehicule.passagers_a_bord > nouvelle_capacite
    ):
        raise HTTPException(
            status_code=409,
            detail="La capacité ne peut pas être inférieure aux passagers à bord.",
        )

    for champ, valeur in modifications.items():
        setattr(vehicule, champ, valeur)
    session.add(vehicule)
    session.commit()
    session.refresh(vehicule)
    gare = session.get(Gare, responsable.gare_id)
    return serialize_vehicule(session, vehicule, gare)


@router.delete("/vehicules/{vehicule_id}")
def supprimer_vehicule(
    vehicule_id: int,
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> dict:
    vehicule = _vehicule_de_la_gare(session, vehicule_id, responsable)
    if vehicule.statut != VEHICULE_EN_ATTENTE:
        raise HTTPException(
            status_code=409,
            detail="Un départ déjà effectué ou annulé ne peut pas être supprimé.",
        )

    reservations = session.exec(
        select(Reservation).where(Reservation.vehicule_id == vehicule.id)
    ).all()
    for reservation in reservations:
        session.delete(reservation)
    session.delete(vehicule)
    session.commit()
    return {"message": "Véhicule et réservations associées supprimés."}


@router.patch("/vehicules/{vehicule_id}/occupation")
def mettre_a_jour_occupation(
    vehicule_id: int,
    donnees: OccupationUpdate,
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> dict:
    vehicule = _vehicule_de_la_gare(session, vehicule_id, responsable)
    if vehicule.statut != VEHICULE_EN_ATTENTE:
        raise HTTPException(
            status_code=409,
            detail="Seul un départ en attente peut être modifié.",
        )
    if (
        donnees.passagers_a_bord is not None
        and donnees.passagers_a_bord > vehicule.capacite
    ):
        raise HTTPException(
            status_code=422,
            detail="Le nombre de passagers dépasse la capacité du véhicule.",
        )

    vehicule.passagers_a_bord = donnees.passagers_a_bord
    session.add(vehicule)
    session.commit()
    session.refresh(vehicule)
    gare = session.get(Gare, responsable.gare_id)
    return serialize_vehicule(session, vehicule, gare)


@router.post("/vehicules/{vehicule_id}/depart")
def valider_depart(
    vehicule_id: int,
    donnees: DepartRequest,
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> dict:
    vehicule = _vehicule_de_la_gare(session, vehicule_id, responsable)
    if vehicule.statut == VEHICULE_PARTI:
        raise HTTPException(status_code=409, detail="Ce véhicule est déjà parti.")
    if vehicule.statut == VEHICULE_ANNULE:
        raise HTTPException(
            status_code=409,
            detail="Ce départ a été annulé et ne peut plus partir.",
        )

    if (
        donnees.passagers_a_bord is not None
        and donnees.passagers_a_bord > vehicule.capacite
    ):
        raise HTTPException(
            status_code=422,
            detail="Le nombre de passagers dépasse la capacité du véhicule.",
        )

    reservees = places_reservees(session, vehicule.id)
    occupation = (
        donnees.passagers_a_bord
        if donnees.passagers_a_bord is not None
        else vehicule.passagers_a_bord
        if vehicule.passagers_a_bord is not None
        else reservees
    )
    capacite = max(vehicule.capacite, 1)
    taux = min(100, round((occupation / capacite) * 100))
    gare = session.get(Gare, responsable.gare_id)
    seuil = gare.seuil_remplissage if gare else 70

    if taux < seuil and not donnees.forcer:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "seuil_non_atteint",
                "message": (
                    f"Remplissage à {taux} % alors que le seuil recommandé "
                    f"pour {gare.nom if gare else 'cette gare'} est de {seuil} %. "
                    "Confirmez un départ anticipé si nécessaire."
                ),
                "taux_remplissage": taux,
                "seuil_remplissage": seuil,
            },
        )

    vehicule.passagers_a_bord = occupation
    vehicule.statut = VEHICULE_PARTI
    vehicule.departed_at = utcnow()
    session.add(vehicule)
    session.commit()
    session.refresh(vehicule)
    return {
        "message": "Départ validé. Le tableau public est à jour.",
        "vehicule": serialize_vehicule(session, vehicule, gare),
    }


@router.post("/vehicules/{vehicule_id}/annuler")
def annuler_depart(
    vehicule_id: int,
    donnees: AnnulationRequest,
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> dict:
    vehicule = _vehicule_de_la_gare(session, vehicule_id, responsable)
    if vehicule.statut == VEHICULE_PARTI:
        raise HTTPException(
            status_code=409,
            detail="Impossible d'annuler un départ déjà effectué.",
        )
    if vehicule.statut == VEHICULE_ANNULE:
        raise HTTPException(status_code=409, detail="Départ déjà annulé.")

    motif = (
        donnees.motif.strip() if donnees.motif else "Départ annulé par la gare"
    )
    vehicule.statut = VEHICULE_ANNULE
    vehicule.cancellation_reason = motif
    reservations = session.exec(
        select(Reservation).where(
            Reservation.vehicule_id == vehicule.id,
            Reservation.statut != RESERVATION_ANNULE,
        )
    ).all()
    for reservation in reservations:
        reservation.statut = RESERVATION_ANNULE
        reservation.annule_le = utcnow()
        reservation.motif_annulation = motif
        if reservation.payment_status == PAIEMENT_PAYE:
            reservation.payment_status = PAIEMENT_REMBOURSE
        session.add(reservation)

    session.add(vehicule)
    session.commit()
    session.refresh(vehicule)
    gare = session.get(Gare, responsable.gare_id)
    return {
        "message": "Départ annulé. Les billets concernés sont invalidés.",
        "vehicule": serialize_vehicule(session, vehicule, gare),
    }
