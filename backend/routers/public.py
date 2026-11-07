import uuid
from datetime import date, datetime
from urllib.parse import parse_qs, unquote, urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func
from sqlmodel import Session, select

from config import ANNULATION_DELAI_HEURES
from database import get_session
from models import (
    MOYENS_PAIEMENT,
    PAIEMENT_EN_ATTENTE,
    PAIEMENT_PAYE,
    PAIEMENT_REMBOURSE,
    Gare,
    Reservation,
    Responsable,
    Vehicule,
    RESERVATION_ANNULE,
    RESERVATION_EMBARQUE,
    RESERVATION_RESERVE,
    VEHICULE_ANNULE,
    VEHICULE_EN_ATTENTE,
    VEHICULE_PARTI,
    utcnow,
)
from schemas import PaiementRequest, ReservationCreate, ScanRequest
from security import get_current_responsable
from serializers import (
    limite_annulation,
    serialize_gare,
    serialize_reservation,
    serialize_vehicule,
)
from tickets import construire_ticket_pdf, generer_qr_png

router = APIRouter(prefix="/api", tags=["Public"])


def _extraire_code(contenu: str) -> str:
    contenu = contenu.strip()
    if "code=" in contenu:
        requete = urlparse(contenu)
        valeurs = parse_qs(requete.query).get("code")
        if valeurs:
            return valeurs[0].strip()

    chemin = urlparse(contenu).path.rstrip("/")
    for marqueur in ("/ticket/", "/reservations/"):
        if marqueur in chemin:
            return unquote(chemin.rsplit(marqueur, 1)[1]).strip()

    return contenu


def _trouver_reservation(session: Session, code: str) -> Reservation:
    reservation = session.exec(
        select(Reservation).where(
            func.upper(Reservation.code_qr) == code.strip().upper()
        )
    ).first()
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Billet introuvable. Vérifiez le code ou le QR code.",
        )
    return reservation


@router.get("/gares")
def lister_gares(session: Session = Depends(get_session)) -> list[dict]:
    gares = session.exec(select(Gare).order_by(Gare.id)).all()
    return [serialize_gare(gare) for gare in gares]


@router.get("/gares/{gare_id}/destinations")
def lister_destinations(
    gare_id: int,
    session: Session = Depends(get_session),
) -> list[dict]:
    gare = session.get(Gare, gare_id)
    if gare is None:
        raise HTTPException(status_code=404, detail="Gare introuvable.")

    vehicules = session.exec(
        select(Vehicule)
        .where(Vehicule.gare_id == gare_id)
        .order_by(Vehicule.destination)
    ).all()

    destinations: dict[str, dict] = {}
    for vehicule in vehicules:
        cle = vehicule.destination.lower()
        if cle not in destinations:
            destinations[cle] = {
                "nom": vehicule.destination,
                "prix_indicatif": vehicule.prix,
                "duree_minutes": vehicule.duree_minutes,
            }
    return sorted(destinations.values(), key=lambda item: item["nom"])


@router.get("/vehicules/{vehicule_id}")
def detail_public_vehicule(
    vehicule_id: int,
    session: Session = Depends(get_session),
) -> dict:
    vehicule = session.get(Vehicule, vehicule_id)
    if vehicule is None:
        raise HTTPException(status_code=404, detail="Départ introuvable.")
    return serialize_vehicule(session, vehicule)


@router.get("/recherche")
def rechercher_departs(
    gare_id: int,
    destination: str | None = None,
    date_recherche: date | None = Query(default=None, alias="date"),
    session: Session = Depends(get_session),
) -> list[dict]:
    if session.get(Gare, gare_id) is None:
        raise HTTPException(status_code=404, detail="Gare introuvable.")

    requete = select(Vehicule).where(
        Vehicule.gare_id == gare_id,
        Vehicule.statut == VEHICULE_EN_ATTENTE,
    )
    if destination:
        requete = requete.where(
            func.lower(Vehicule.destination) == destination.strip().lower()
        )
    if date_recherche:
        requete = requete.where(Vehicule.date_depart == date_recherche)

    requete = requete.order_by(Vehicule.date_depart, Vehicule.heure_depart)
    vehicules = session.exec(requete).all()
    gare = session.get(Gare, gare_id)
    return [serialize_vehicule(session, vehicule, gare) for vehicule in vehicules]


@router.get("/departs-publics")
def tableau_departs(
    gare_id: int | None = None,
    date_consultee: date | None = Query(default=None, alias="date"),
    session: Session = Depends(get_session),
) -> list[dict]:
    jour = date_consultee or date.today()
    requete = select(Vehicule).where(Vehicule.date_depart == jour)
    if gare_id is not None:
        if session.get(Gare, gare_id) is None:
            raise HTTPException(status_code=404, detail="Gare introuvable.")
        requete = requete.where(Vehicule.gare_id == gare_id)

    vehicules = session.exec(requete).all()
    priorite = {
        VEHICULE_EN_ATTENTE: 0,
        VEHICULE_PARTI: 1,
        VEHICULE_ANNULE: 2,
    }
    vehicules.sort(
        key=lambda v: (
            priorite.get(v.statut, 3),
            v.heure_depart,
            v.destination.lower(),
        )
    )
    return [serialize_vehicule(session, vehicule) for vehicule in vehicules]


@router.post("/reservations", status_code=status.HTTP_201_CREATED)
def creer_reservation(
    donnees: ReservationCreate,
    session: Session = Depends(get_session),
) -> dict:
    vehicule = session.get(Vehicule, donnees.vehicule_id)
    if vehicule is None:
        raise HTTPException(status_code=404, detail="Départ introuvable.")
    if vehicule.statut != VEHICULE_EN_ATTENTE:
        raise HTTPException(
            status_code=409,
            detail="Ce départ n'est plus disponible à la réservation.",
        )

    deja_reservees = session.exec(
        select(func.coalesce(func.sum(Reservation.nombre_places), 0)).where(
            Reservation.vehicule_id == vehicule.id,
            Reservation.statut != RESERVATION_ANNULE,
        )
    ).one()
    places_restantes = vehicule.capacite - int(deja_reservees or 0)
    if donnees.nombre_places > places_restantes:
        raise HTTPException(
            status_code=409,
            detail=(
                "Il ne reste que {} place(s) disponible(s) sur ce départ.".format(
                    max(places_restantes, 0)
                )
            ),
        )

    reservation = Reservation(
        vehicule_id=vehicule.id,
        nom_passager=donnees.nom_passager,
        email_passager=donnees.email_passager,
        telephone_passager=donnees.telephone_passager,
        nombre_places=donnees.nombre_places,
        code_qr=f"TB-{uuid.uuid4().hex.upper()}",
        statut=RESERVATION_RESERVE,
        payment_method=donnees.moyen_paiement,
        payment_status=PAIEMENT_EN_ATTENTE,
    )
    session.add(reservation)
    session.commit()
    session.refresh(reservation)
    return serialize_reservation(session, reservation)


@router.get("/reservations/{code_qr}")
def obtenir_reservation(
    code_qr: str,
    session: Session = Depends(get_session),
) -> dict:
    reservation = _trouver_reservation(session, code_qr)
    return serialize_reservation(session, reservation)


@router.post("/reservations/{code_qr}/payer")
def payer_reservation(
    code_qr: str,
    donnees: PaiementRequest,
    session: Session = Depends(get_session),
) -> dict:
    reservation = _trouver_reservation(session, code_qr)
    if reservation.statut == RESERVATION_ANNULE:
        raise HTTPException(
            status_code=409,
            detail="Cette réservation a été annulée. Paiement impossible.",
        )

    if reservation.payment_status != PAIEMENT_PAYE:
        reservation.payment_method = donnees.moyen
        reservation.payment_status = PAIEMENT_PAYE
        reservation.payment_reference = (
            f"PAY-{uuid.uuid4().hex[:16].upper()}"
        )
        reservation.paid_at = utcnow()
        session.add(reservation)
        session.commit()
        session.refresh(reservation)

    return {
        "message": (
            "Paiement confirmé via "
            f"{MOYENS_PAIEMENT.get(donnees.moyen, donnees.moyen)}. "
            "Votre QR code est maintenant disponible."
        ),
        "reservation": serialize_reservation(session, reservation),
    }


@router.post("/reservations/{code_qr}/annuler")
def annuler_reservation(
    code_qr: str,
    session: Session = Depends(get_session),
) -> dict:
    reservation = _trouver_reservation(session, code_qr)
    vehicule = session.get(Vehicule, reservation.vehicule_id)

    if vehicule is None:
        raise HTTPException(status_code=404, detail="Départ associé introuvable.")
    if reservation.statut == RESERVATION_EMBARQUE:
        raise HTTPException(
            status_code=409,
            detail="Impossible d'annuler un billet déjà utilisé.",
        )
    if reservation.statut == RESERVATION_ANNULE:
        raise HTTPException(
            status_code=409,
            detail="Cette réservation est déjà annulée.",
        )
    if vehicule.statut in (VEHICULE_PARTI, VEHICULE_ANNULE):
        raise HTTPException(
            status_code=409,
            detail="Le départ n'est plus annulable.",
        )

    limite = limite_annulation(vehicule)
    if datetime.now() > limite:
        raise HTTPException(
            status_code=409,
            detail=(
                "Annulation impossible : le délai de "
                f"{ANNULATION_DELAI_HEURES} h avant le départ est dépassé. "
                "Le billet n'est plus remboursable."
            ),
        )

    reservation.statut = RESERVATION_ANNULE
    reservation.annule_le = utcnow()
    rembourse = reservation.payment_status == PAIEMENT_PAYE
    if rembourse:
        reservation.payment_status = PAIEMENT_REMBOURSE
    session.add(reservation)
    session.commit()
    session.refresh(reservation)

    return {
        "message": (
            "Voyage annulé. Votre billet ne peut plus être utilisé."
            + (" Le paiement sera remboursé." if rembourse else "")
        ),
        "reservation": serialize_reservation(session, reservation),
    }


@router.get("/reservations/{code_qr}/qr.png")
def obtenir_qr(
    code_qr: str,
    session: Session = Depends(get_session),
) -> Response:
    reservation = _trouver_reservation(session, code_qr)
    if reservation.payment_status != PAIEMENT_PAYE:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Paiement requis avant de générer le QR code.",
        )
    png = generer_qr_png(reservation.code_qr)
    return Response(
        content=png,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/reservations/{code_qr}/ticket.pdf")
def telecharger_ticket(
    code_qr: str,
    session: Session = Depends(get_session),
) -> Response:
    reservation = _trouver_reservation(session, code_qr)
    if reservation.payment_status != PAIEMENT_PAYE:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Paiement requis avant de télécharger le billet.",
        )
    vehicule = session.get(Vehicule, reservation.vehicule_id)
    if vehicule is None:
        raise HTTPException(status_code=404, detail="Départ introuvable.")
    gare = session.get(Gare, vehicule.gare_id)
    pdf = construire_ticket_pdf(
        reservation,
        vehicule,
        gare,
        generer_qr_png(reservation.code_qr),
    )
    nom_fichier = f"ticket-{reservation.code_qr}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{nom_fichier}"',
            "Cache-Control": "no-store",
        },
    )


@router.post("/scan")
def scanner_billet(
    donnees: ScanRequest,
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> dict:
    code = _extraire_code(donnees.code)
    reservation = _trouver_reservation(session, code)
    vehicule = session.get(Vehicule, reservation.vehicule_id)

    if vehicule is None:
        raise HTTPException(status_code=404, detail="Départ associé introuvable.")
    if vehicule.gare_id != responsable.gare_id:
        raise HTTPException(
            status_code=403,
            detail="Ce billet appartient à une autre gare.",
        )
    if reservation.statut == RESERVATION_ANNULE or vehicule.statut == VEHICULE_ANNULE:
        raise HTTPException(
            status_code=409,
            detail="Ce billet a été annulé. Embarquement refusé.",
        )
    if reservation.payment_status != PAIEMENT_PAYE:
        raise HTTPException(
            status_code=409,
            detail="Paiement non finalisé. Embarquement refusé.",
        )
    if reservation.statut == RESERVATION_EMBARQUE:
        raise HTTPException(
            status_code=409,
            detail="Ce billet a déjà été scanné. Embarquement déjà validé.",
        )
    if vehicule.statut == VEHICULE_PARTI:
        raise HTTPException(
            status_code=409,
            detail="Le véhicule a déjà quitté la gare. Embarquement impossible.",
        )

    reservation.statut = RESERVATION_EMBARQUE
    reservation.embarque_le = utcnow()
    session.add(reservation)
    session.commit()
    session.refresh(reservation)

    return {
        "message": "Embarquement validé",
        "reservation": serialize_reservation(session, reservation),
    }
