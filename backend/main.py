from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from config import CORS_ORIGINS
from database import create_db_and_tables, engine
from routers import auth, backoffice, public
from seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db_and_tables()
    with Session(engine) as session:
        seed_database(session)
    yield


app = FastAPI(
    title="TaxiGare Antsirabe API",
    description=(
        "API de gestion des départs des gares routières d'Asabotsy et Vatofotsy."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public.router)
app.include_router(auth.router)
app.include_router(backoffice.router)


@app.get("/api/health", tags=["Santé"])
def sante() -> dict:
    return {"status": "ok", "service": "taxigare-api"}
