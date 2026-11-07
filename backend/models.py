from datetime import date, datetime, time, timezone
from typing import Optional

from sqlmodel import Field, SQLModel

VEHICULE_EN_ATTENTE = "en_attente"
VEHICULE_PARTI = "parti"
VEHICULE_ANNULE = "annule"

RESERVATION_RESERVE = "reserve"
RESERVATION_EMBARQUE = "embarque"
RESERVATION_ANNULE = "annule"

PAIEMENT_EN_ATTENTE = "en_attente"
PAIEMENT_PAYE = "paye"
PAIEMENT_REMBOURSE = "rembourse"
PAIEMENT_ECHOUE = "echoue"

MOYENS_PAIEMENT = {
    "bitcoin": "Bitcoin",
    "airtel_money": "Airtel Money",
    "orange_money": "Orange Money",
    "mvola": "MVola",
    "carte_bancaire": "Carte bancaire",
    "paypal": "PayPal",
}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Gare(SQLModel, table=True):
    __tablename__ = "gares"

    id: Optional[int] = Field(default=None, primary_key=True)
    nom: str = Field(index=True, max_length=80)
    code: str = Field(unique=True, index=True, max_length=40)
    seuil_remplissage: int = Field(default=70)
    description: str = Field(default="")
    ouverte_24h: bool = Field(default=False)


class Responsable(SQLModel, table=True):
    __tablename__ = "responsables"

    id: Optional[int] = Field(default=None, primary_key=True)
    gare_id: int = Field(foreign_key="gares.id", index=True)
    nom: str = Field(max_length=120)
    email: str = Field(unique=True, index=True, max_length=160)
    mot_de_passe_hash: str


class Vehicule(SQLModel, table=True):
    __tablename__ = "vehicules"

    id: Optional[int] = Field(default=None, primary_key=True)
    gare_id: int = Field(foreign_key="gares.id", index=True)
    matricule: str = Field(index=True, max_length=40)
    destination: str = Field(index=True, max_length=120)
    chauffeur: str = Field(max_length=120)
    capacite: int = Field(default=18)
    statut: str = Field(default=VEHICULE_EN_ATTENTE, index=True)
    date_depart: date = Field(index=True)
    heure_depart: time
    prix: int = Field(default=0)
    duree_minutes: int = Field(default=60)
    passagers_a_bord: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=utcnow)
    departed_at: Optional[datetime] = Field(default=None)
    cancellation_reason: Optional[str] = Field(default=None)


class Reservation(SQLModel, table=True):
    __tablename__ = "reservations"

    id: Optional[int] = Field(default=None, primary_key=True)
    vehicule_id: int = Field(foreign_key="vehicules.id", index=True)
    nom_passager: str = Field(max_length=160)
    email_passager: str = Field(default="", max_length=160)
    telephone_passager: str = Field(default="", max_length=40)
    nombre_places: int = Field(default=1)
    code_qr: str = Field(unique=True, index=True, max_length=80)
    statut: str = Field(default=RESERVATION_RESERVE, index=True)
    payment_method: Optional[str] = Field(default=None, max_length=40)
    payment_status: str = Field(default=PAIEMENT_EN_ATTENTE, index=True)
    payment_reference: Optional[str] = Field(default=None, max_length=120)
    paid_at: Optional[datetime] = Field(default=None)
    annule_le: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=utcnow)
    embarque_le: Optional[datetime] = Field(default=None)
