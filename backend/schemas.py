import re
from datetime import date, time
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from models import MOYENS_PAIEMENT

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
TELEPHONE_REGEX = re.compile(r"^[0-9+][0-9 .-]{5,19}$")


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=160)
    mot_de_passe: str = Field(min_length=1, max_length=200)

    @field_validator("email")
    @classmethod
    def normaliser_email(cls, valeur: str) -> str:
        return valeur.strip().lower()


class ReservationCreate(BaseModel):
    vehicule_id: int
    nom_passager: str = Field(min_length=2, max_length=160)
    email_passager: str = Field(min_length=5, max_length=160)
    telephone_passager: str = Field(min_length=7, max_length=40)
    nombre_places: int = Field(default=1, ge=1, le=20)
    moyen_paiement: Optional[str] = None

    @field_validator("nom_passager")
    @classmethod
    def nettoyer_nom(cls, valeur: str) -> str:
        return " ".join(valeur.split())

    @field_validator("email_passager")
    @classmethod
    def valider_email(cls, valeur: str) -> str:
        valeur = valeur.strip().lower()
        if not EMAIL_REGEX.match(valeur):
            raise ValueError("Adresse email invalide.")
        return valeur

    @field_validator("telephone_passager")
    @classmethod
    def valider_telephone(cls, valeur: str) -> str:
        valeur = " ".join(valeur.split())
        if not TELEPHONE_REGEX.match(valeur):
            raise ValueError("Numéro de téléphone invalide.")
        return valeur

    @field_validator("moyen_paiement")
    @classmethod
    def valider_moyen_paiement(cls, valeur: Optional[str]) -> Optional[str]:
        if valeur is None or valeur == "":
            return None
        if valeur not in MOYENS_PAIEMENT:
            raise ValueError("Moyen de paiement non pris en charge.")
        return valeur


class PaiementRequest(BaseModel):
    moyen: str = Field(min_length=2, max_length=40)

    @field_validator("moyen")
    @classmethod
    def valider_moyen(cls, valeur: str) -> str:
        if valeur not in MOYENS_PAIEMENT:
            raise ValueError("Moyen de paiement non pris en charge.")
        return valeur


class ScanRequest(BaseModel):
    code: str = Field(min_length=4, max_length=500)


class VehiculeCreate(BaseModel):
    matricule: str = Field(min_length=2, max_length=40)
    destination: str = Field(min_length=2, max_length=120)
    chauffeur: str = Field(min_length=2, max_length=120)
    capacite: int = Field(ge=4, le=100)
    date_depart: date
    heure_depart: time
    prix: int = Field(ge=0, le=1_000_000)
    duree_minutes: int = Field(ge=5, le=1440)

    @field_validator("matricule", "chauffeur")
    @classmethod
    def nettoyer_texte(cls, valeur: str) -> str:
        return " ".join(valeur.split())

    @field_validator("destination")
    @classmethod
    def formater_destination(cls, valeur: str) -> str:
        valeur = " ".join(valeur.split())
        return valeur[:1].upper() + valeur[1:]


class VehiculeUpdate(BaseModel):
    matricule: Optional[str] = Field(default=None, min_length=2, max_length=40)
    destination: Optional[str] = Field(default=None, min_length=2, max_length=120)
    chauffeur: Optional[str] = Field(default=None, min_length=2, max_length=120)
    capacite: Optional[int] = Field(default=None, ge=4, le=100)
    date_depart: Optional[date] = None
    heure_depart: Optional[time] = None
    prix: Optional[int] = Field(default=None, ge=0, le=1_000_000)
    duree_minutes: Optional[int] = Field(default=None, ge=5, le=1440)

    @field_validator("matricule", "chauffeur")
    @classmethod
    def nettoyer_texte(cls, valeur: Optional[str]) -> Optional[str]:
        if valeur is None:
            return valeur
        return " ".join(valeur.split())

    @field_validator("destination")
    @classmethod
    def formater_destination(cls, valeur: Optional[str]) -> Optional[str]:
        if valeur is None:
            return valeur
        valeur = " ".join(valeur.split())
        return valeur[:1].upper() + valeur[1:]


class OccupationUpdate(BaseModel):
    passagers_a_bord: Optional[int] = Field(default=None, ge=0, le=100)


class DepartRequest(BaseModel):
    passagers_a_bord: Optional[int] = Field(default=None, ge=0, le=100)
    forcer: bool = False


class AnnulationRequest(BaseModel):
    motif: Optional[str] = Field(default=None, max_length=250)
