from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from database import get_session
from models import Gare, Responsable
from schemas import LoginRequest
from security import creer_token, get_current_responsable, verify_password
from serializers import serialize_gare

router = APIRouter(prefix="/api/auth", tags=["Authentification"])


def _profil(session: Session, responsable: Responsable) -> dict:
    gare = session.get(Gare, responsable.gare_id)
    return {
        "id": responsable.id,
        "nom": responsable.nom,
        "email": responsable.email,
        "gare_id": responsable.gare_id,
        "gare": serialize_gare(gare) if gare else None,
    }


@router.post("/login")
def connexion(
    donnees: LoginRequest,
    session: Session = Depends(get_session),
) -> dict:
    responsable = session.exec(
        select(Responsable).where(Responsable.email == donnees.email)
    ).first()
    if responsable is None or not verify_password(
        donnees.mot_de_passe, responsable.mot_de_passe_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "access_token": creer_token(responsable),
        "token_type": "bearer",
        "responsable": _profil(session, responsable),
    }


@router.get("/me")
def mon_profil(
    responsable: Responsable = Depends(get_current_responsable),
    session: Session = Depends(get_session),
) -> dict:
    return _profil(session, responsable)
