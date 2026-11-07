import uuid
from datetime import date, time, timedelta

from sqlmodel import Session, select

from models import (
    PAIEMENT_PAYE,
    Gare,
    Reservation,
    Responsable,
    Vehicule,
    RESERVATION_EMBARQUE,
    RESERVATION_RESERVE,
    VEHICULE_EN_ATTENTE,
    VEHICULE_PARTI,
    utcnow,
)
from security import hash_password

GARES = [
    {
        "nom": "Asabotsy",
        "code": "asabotsy",
        "seuil_remplissage": 70,
        "description": (
            "Départs fréquents vers Betafo, Mandoto et Ankazomiritra. "
            "Les véhicules peuvent partir dès 70 % de remplissage."
        ),
        "ouverte_24h": False,
    },
    {
        "nom": "Vatofotsy",
        "code": "vatofotsy",
        "seuil_remplissage": 90,
        "description": (
            "Liaisons longue distance vers Antananarivo, Fianarantsoa et Ambositra. "
            "Départs proches du remplissage complet, gare ouverte 24h/24 en pointe."
        ),
        "ouverte_24h": True,
    },
]

RESPONSABLES = [
    {
        "gare_code": "asabotsy",
        "nom": "Jean Boscos",
        "email": "asabotsy@taxigare.mg",
        "mot_de_passe": "asabotsy2026",
    },
    {
        "gare_code": "vatofotsy",
        "nom": "Tiavina Rinoh",
        "email": "vatofotsy@taxigare.mg",
        "mot_de_passe": "vatofotsy2026",
    },
]

TARIFS = {
    "Antananarivo": 30000,
    "Fianarantsoa": 30000,
    "Mandoto": 10000,
    "Ankazomiritra": 10000,
}

PROGRAMME = {
    "asabotsy": [
        {
            "matricule": "1234 TBA",
            "destination": "Betafo",
            "chauffeur": "Rakoto Jean",
            "capacite": 18,
            "heure": time(7, 30),
            "prix": 3000,
            "duree": 45,
            "remplissage_demo": 16,
            "parti": True,
        },
        {
            "matricule": "2468 TBB",
            "destination": "Betafo",
            "chauffeur": "Randriamalala Soa",
            "capacite": 18,
            "heure": time(12, 30),
            "prix": 3000,
            "duree": 45,
            "remplissage_demo": 11,
        },
        {
            "matricule": "5678 TBC",
            "destination": "Mandoto",
            "chauffeur": "Rabe Michel",
            "capacite": 22,
            "heure": time(8, 0),
            "prix": 10000,
            "duree": 75,
            "remplissage_demo": 16,
        },
        {
            "matricule": "1357 TBD",
            "destination": "Mandoto",
            "chauffeur": "Ratsimba Alain",
            "capacite": 22,
            "heure": time(14, 0),
            "prix": 10000,
            "duree": 75,
            "remplissage_demo": 7,
        },
        {
            "matricule": "9012 TBE",
            "destination": "Ankazomiritra",
            "chauffeur": "Rakoto Paul",
            "capacite": 15,
            "heure": time(9, 0),
            "prix": 10000,
            "duree": 60,
            "remplissage_demo": 11,
        },
        {
            "matricule": "7531 TBF",
            "destination": "Ankazomiritra",
            "chauffeur": "Andriamana Hery",
            "capacite": 15,
            "heure": time(15, 30),
            "prix": 10000,
            "duree": 60,
            "remplissage_demo": 5,
        },
    ],
    "vatofotsy": [
        {
            "matricule": "4321 TCA",
            "destination": "Antananarivo",
            "chauffeur": "Razafy Marcel",
            "capacite": 30,
            "heure": time(6, 30),
            "prix": 30000,
            "duree": 180,
            "remplissage_demo": 29,
            "parti": True,
        },
        {
            "matricule": "8765 TCB",
            "destination": "Antananarivo",
            "chauffeur": "Rakotondrabe Luc",
            "capacite": 30,
            "heure": time(9, 30),
            "prix": 30000,
            "duree": 180,
            "remplissage_demo": 27,
        },
        {
            "matricule": "2469 TCC",
            "destination": "Fianarantsoa",
            "chauffeur": "Raveloarison Eric",
            "capacite": 22,
            "heure": time(7, 0),
            "prix": 30000,
            "duree": 300,
            "remplissage_demo": 20,
        },
        {
            "matricule": "8642 TCD",
            "destination": "Fianarantsoa",
            "chauffeur": "Rasolofo Fanja",
            "capacite": 22,
            "heure": time(13, 0),
            "prix": 30000,
            "duree": 300,
            "remplissage_demo": 13,
        },
        {
            "matricule": "5555 TCE",
            "destination": "Ambositra",
            "chauffeur": "Ramarozatovo Naina",
            "capacite": 20,
            "heure": time(8, 30),
            "prix": 12000,
            "duree": 150,
            "remplissage_demo": 17,
        },
        {
            "matricule": "7777 TCF",
            "destination": "Ambositra",
            "chauffeur": "Rakotobe Solo",
            "capacite": 20,
            "heure": time(14, 30),
            "prix": 12000,
            "duree": 150,
            "remplissage_demo": 8,
        },
    ],
}

NOMS_DEMO = [
    "Soa Andrianina",
    "Tahina Rakoto",
    "Fanja Rasoanaivo",
    "Naina Randria",
    "Hanta Rakotomalala",
    "Tojo Razanakoto",
]


def _seed_gares(session: Session) -> dict[str, Gare]:
    resultat: dict[str, Gare] = {}
    for donnees in GARES:
        gare = session.exec(
            select(Gare).where(Gare.code == donnees["code"])
        ).first()
        if gare is None:
            gare = Gare(**donnees)
            session.add(gare)
            session.commit()
            session.refresh(gare)
        resultat[gare.code] = gare
    return resultat


def _seed_responsables(session: Session, gares: dict[str, Gare]) -> None:
    for donnees in RESPONSABLES:
        existant = session.exec(
            select(Responsable).where(Responsable.email == donnees["email"])
        ).first()
        if existant:
            if existant.nom != donnees["nom"]:
                existant.nom = donnees["nom"]
                session.add(existant)
            continue
        gare = gares[donnees["gare_code"]]
        session.add(
            Responsable(
                gare_id=gare.id,
                nom=donnees["nom"],
                email=donnees["email"],
                mot_de_passe_hash=hash_password(donnees["mot_de_passe"]),
            )
        )
    session.commit()


def _maj_tarifs(session: Session) -> None:
    """Applique les tarifs officiels aux véhicules déjà en base."""
    for destination, prix in TARIFS.items():
        vehicules = session.exec(
            select(Vehicule).where(Vehicule.destination == destination)
        ).all()
        for vehicule in vehicules:
            if vehicule.prix != prix:
                vehicule.prix = prix
                session.add(vehicule)
    session.commit()


def _creer_reservations_demo(
    session: Session, vehicule: Vehicule, nombre_objectif: int
) -> None:
    if nombre_objectif <= 0:
        return
    place_restante = min(nombre_objectif, vehicule.capacite)
    numero = 0
    while place_restante > 0:
        places = min(place_restante, 3 if numero == 0 else 2)
        nom = NOMS_DEMO[numero % len(NOMS_DEMO)]
        statut = (
            RESERVATION_EMBARQUE
            if vehicule.statut == VEHICULE_PARTI
            else RESERVATION_RESERVE
        )
        session.add(
            Reservation(
                vehicule_id=vehicule.id,
                nom_passager=nom,
                email_passager=f"demo{numero + 1}@taxigare.mg",
                telephone_passager=f"034000000{numero % 10}",
                nombre_places=places,
                code_qr=f"DEMO-{uuid.uuid4().hex[:12].upper()}",
                statut=statut,
                payment_method="mvola",
                payment_status=PAIEMENT_PAYE,
                payment_reference=f"DEMO-{uuid.uuid4().hex[:10].upper()}",
                paid_at=utcnow(),
            )
        )
        place_restante -= places
        numero += 1
    vehicule.passagers_a_bord = (
        nombre_objectif if vehicule.statut == VEHICULE_PARTI else None
    )
    session.add(vehicule)


def seed_database(session: Session) -> None:
    """Crée les données de démonstration si la base est encore vide."""
    gares = _seed_gares(session)
    _seed_responsables(session, gares)
    _maj_tarifs(session)

    vehicule_existant = session.exec(select(Vehicule)).first()
    if vehicule_existant:
        return

    aujourd_hui = date.today()
    for decalage in range(4):
        jour = aujourd_hui + timedelta(days=decalage)
        for code_gare, courses in PROGRAMME.items():
            gare = gares[code_gare]
            for course in courses:
                parti = decalage == 0 and course.get("parti", False)
                vehicule = Vehicule(
                    gare_id=gare.id,
                    matricule=course["matricule"],
                    destination=course["destination"],
                    chauffeur=course["chauffeur"],
                    capacite=course["capacite"],
                    statut=VEHICULE_PARTI if parti else VEHICULE_EN_ATTENTE,
                    date_depart=jour,
                    heure_depart=course["heure"],
                    prix=course["prix"],
                    duree_minutes=course["duree"],
                )
                session.add(vehicule)
                session.commit()
                session.refresh(vehicule)

                if decalage == 0:
                    _creer_reservations_demo(
                        session,
                        vehicule,
                        course["remplissage_demo"],
                    )
                else:
                    vehicule.passagers_a_bord = None
                    session.add(vehicule)

    session.commit()
