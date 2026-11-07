import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlmodel import Session

from config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY
from database import get_session
from models import Responsable

bearer_scheme = HTTPBearer(auto_error=False)
PBKDF2_ITERATIONS = 260_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return "pbkdf2_sha256${}${}${}".format(
        PBKDF2_ITERATIONS,
        base64.b64encode(salt).decode("ascii"),
        base64.b64encode(digest).decode("ascii"),
    )


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithme, iterations, salt_b64, digest_b64 = encoded.split("$", 3)
        if algorithme != "pbkdf2_sha256":
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt, int(iterations)
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def creer_token(responsable: Responsable) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(responsable.id),
        "gare_id": responsable.gare_id,
        "exp": expiration,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _erreur_authentification() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentification requise ou session expirée.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_responsable(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> Responsable:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _erreur_authentification()

    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        responsable_id = int(payload.get("sub", ""))
    except (JWTError, ValueError, TypeError):
        raise _erreur_authentification()

    responsable = session.get(Responsable, responsable_id)
    if responsable is None:
        raise _erreur_authentification()
    return responsable
