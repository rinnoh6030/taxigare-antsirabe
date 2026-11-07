import os
from collections.abc import Generator

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gare.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

COLONNES_RESERVATIONS = {
    "email_passager": "VARCHAR(160) NOT NULL DEFAULT ''",
    "telephone_passager": "VARCHAR(40) NOT NULL DEFAULT ''",
    "payment_method": "VARCHAR",
    "payment_status": "VARCHAR NOT NULL DEFAULT 'en_attente'",
    "payment_reference": "VARCHAR",
    "paid_at": "DATETIME",
    "annule_le": "DATETIME",
}


def _migrer_schema() -> None:
    """Ajoute les nouvelles colonnes aux bases SQLite existantes."""
    with engine.begin() as connexion:
        inspecteur = inspect(connexion)
        if "reservations" not in inspecteur.get_table_names():
            return

        existantes = {
            colonne["name"]
            for colonne in inspecteur.get_columns("reservations")
        }
        for nom, definition in COLONNES_RESERVATIONS.items():
            if nom not in existantes:
                connexion.execute(
                    text(
                        f"ALTER TABLE reservations ADD COLUMN {nom} {definition}"
                    )
                )

        connexion.execute(
            text(
                "UPDATE reservations SET payment_status = 'paye', "
                "payment_method = COALESCE(payment_method, 'mvola'), "
                "payment_reference = COALESCE(payment_reference, 'DEMO-LEGACY') "
                "WHERE code_qr LIKE 'DEMO-%' AND payment_status = 'en_attente'"
            )
        )
        connexion.execute(
            text(
                "UPDATE reservations SET email_passager = 'passager.demo@taxigare.mg' "
                "WHERE email_passager IS NULL OR email_passager = ''"
            )
        )
        connexion.execute(
            text(
                "UPDATE reservations SET telephone_passager = '0340000000' "
                "WHERE telephone_passager IS NULL OR telephone_passager = ''"
            )
        )


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
    _migrer_schema()


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
