from datetime import date, datetime, time, timedelta

from sqlmodel import Session, func, select

from config import ANNULATION_DELAI_HEURES
from models import (
    MOYENS_PAIEMENT,
    PAIEMENT_PAYE,
    RESERVATION_ANNULE,
    RESERVATION_RESERVE,
    VEHICULE_EN_ATTENTE,
    Cooperative,
    Gare,
    Reservation,
    Vehicule,
)


def format_heure(valeur: time) -> str:
    return f"{valeur.hour:02d}h{valeur.minute:02d}"


def format_creneau(heure_depart: time) -> str:
    fin = (datetime.combine(date.min, heure_depart) + timedelta(hours=1)).time()
    return f"{format_heure(heure_depart)} - {format_heure(fin)}"


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def serialize_gare(gare: Gare) -> dict:
    return {
        "id": gare.id,
        "nom": gare.nom,
        "code": gare.code,
        "seuil_remplissage": gare.seuil_remplissage,
        "description": gare.description,
        "ouverte_24h": gare.ouverte_24h,
    }


def serialize_cooperative(cooperative: Cooperative) -> dict:
    return {
        "id": cooperative.id,
        "gare_id": cooperative.gare_id,
        "nom": cooperative.nom,
        "telephone": cooperative.telephone,
        "secretaire": cooperative.secretaire,
        "est_premium": cooperative.est_premium,
    }


def places_reservees(session: Session, vehicule_id: int) -> int:
    total = session.exec(
        select(func.coalesce(func.sum(Reservation.nombre_places), 0)).where(
            Reservation.vehicule_id == vehicule_id,
            Reservation.statut != "annule",
        )
    ).one()
    return int(total or 0)


def places_embarquees(session: Session, vehicule_id: int) -> int:
    total = session.exec(
        select(func.coalesce(func.sum(Reservation.nombre_places), 0)).where(
            Reservation.vehicule_id == vehicule_id,
            Reservation.statut == "embarque",
        )
    ).one()
    return int(total or 0)


def serialize_vehicule(
    session: Session, vehicule: Vehicule, gare: Gare | None = None
) -> dict:
    gare = gare or session.get(Gare, vehicule.gare_id)
    cooperative = (
        session.get(Cooperative, vehicule.cooperative_id)
        if vehicule.cooperative_id
        else None
    )
    reservees = places_reservees(session, vehicule.id)
    embarquees = places_embarquees(session, vehicule.id)
    capacite = max(vehicule.capacite, 1)

    occupation = (
        vehicule.passagers_a_bord
        if vehicule.passagers_a_bord is not None
        else reservees
    )
    occupation = max(0, occupation)
    taux = min(100, round((occupation / capacite) * 100))
    seuil = gare.seuil_remplissage if gare else 70

    return {
        "id": vehicule.id,
        "gare_id": vehicule.gare_id,
        "gare": serialize_gare(gare) if gare else None,
        "cooperative_id": vehicule.cooperative_id,
        "cooperative": serialize_cooperative(cooperative) if cooperative else None,
        "matricule": vehicule.matricule,
        "destination": vehicule.destination,
        "chauffeur": vehicule.chauffeur,
        "chauffeur_telephone": vehicule.chauffeur_telephone,
        "capacite": vehicule.capacite,
        "statut": vehicule.statut,
        "date_depart": vehicule.date_depart.isoformat(),
        "heure_depart": format_heure(vehicule.heure_depart),
        "heure_depart_24h": vehicule.heure_depart.strftime("%H:%M"),
        "creneau": format_creneau(vehicule.heure_depart),
        "prix": vehicule.prix,
        "duree_minutes": vehicule.duree_minutes,
        "places_reservees": reservees,
        "places_embarquees": embarquees,
        "places_restantes": max(vehicule.capacite - reservees, 0),
        "passagers_a_bord": vehicule.passagers_a_bord,
        "occupation": occupation,
        "taux_remplissage": taux,
        "seuil_remplissage": seuil,
        "pret_au_depart": taux >= seuil,
        "departed_at": _iso(vehicule.departed_at),
        "cancellation_reason": vehicule.cancellation_reason,
    }


def limite_annulation(vehicule: Vehicule) -> datetime:
    depart = datetime.combine(vehicule.date_depart, vehicule.heure_depart)
    return depart - timedelta(hours=ANNULATION_DELAI_HEURES)


def serialize_reservation(session: Session, reservation: Reservation) -> dict:
    vehicule = session.get(Vehicule, reservation.vehicule_id)
    gare = session.get(Gare, vehicule.gare_id) if vehicule else None
    cooperative = (
        session.get(Cooperative, vehicule.cooperative_id)
        if vehicule and vehicule.cooperative_id
        else None
    )
    limite = limite_annulation(vehicule) if vehicule else None
    annulable = bool(
        vehicule
        and reservation.statut == RESERVATION_RESERVE
        and vehicule.statut == VEHICULE_EN_ATTENTE
        and datetime.now() <= limite
    )
    annulable_par_gare = bool(
        vehicule
        and reservation.statut == RESERVATION_RESERVE
        and vehicule.statut == VEHICULE_EN_ATTENTE
    )
    paye = reservation.payment_status == PAIEMENT_PAYE
    return {
        "id": reservation.id,
        "code_qr": reservation.code_qr,
        "nom_passager": reservation.nom_passager,
        "email_passager": reservation.email_passager,
        "telephone_passager": reservation.telephone_passager,
        "nombre_places": reservation.nombre_places,
        "statut": reservation.statut,
        "payment_method": reservation.payment_method,
        "payment_method_label": MOYENS_PAIEMENT.get(
            reservation.payment_method or ""
        ),
        "payment_status": reservation.payment_status,
        "payment_reference": reservation.payment_reference,
        "paid_at": _iso(reservation.paid_at),
        "annule_le": _iso(reservation.annule_le),
        "motif_annulation": reservation.motif_annulation,
        "paiement_requis": not paye,
        "qr_disponible": paye
        and reservation.statut != RESERVATION_ANNULE
        and (vehicule is None or vehicule.statut != "annule"),
        "annulable": annulable,
        "annulable_par_gare": annulable_par_gare,
        "annulation_limite": _iso(limite),
        "created_at": _iso(reservation.created_at),
        "embarque_le": _iso(reservation.embarque_le),
        "vehicule": (
            {
                "id": vehicule.id,
                "matricule": vehicule.matricule,
                "destination": vehicule.destination,
                "chauffeur": vehicule.chauffeur,
                "chauffeur_telephone": vehicule.chauffeur_telephone,
                "cooperative": (
                    serialize_cooperative(cooperative)
                    if cooperative
                    else None
                ),
                "date_depart": vehicule.date_depart.isoformat(),
                "heure_depart": format_heure(vehicule.heure_depart),
                "creneau": format_creneau(vehicule.heure_depart),
                "prix": vehicule.prix,
                "duree_minutes": vehicule.duree_minutes,
                "statut": vehicule.statut,
                "gare": serialize_gare(gare) if gare else None,
            }
            if vehicule
            else None
        ),
        "total": (vehicule.prix * reservation.nombre_places) if vehicule else 0,
    }
