import os


def _avec_schema(url: str) -> str:
    """Ajoute https:// aux hostnames Render fournis sans protocole."""
    url = url.strip().rstrip("/")
    if not url:
        return url
    if not url.startswith(("http://", "https://")):
        return f"https://{url}"
    return url


SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-a-changer-en-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))
FRONTEND_URL = _avec_schema(os.getenv("FRONTEND_URL", "http://localhost:5173"))
ANNULATION_DELAI_HEURES = int(os.getenv("ANNULATION_DELAI_HEURES", "2"))

_cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
CORS_ORIGINS = [
    _avec_schema(origine)
    for origine in _cors_origins.split(",")
    if origine.strip()
]
