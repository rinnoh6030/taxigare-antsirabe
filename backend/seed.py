import uuid
from datetime import date, time, timedelta

from sqlmodel import Session, select

from models import (
    PAIEMENT_PAYE,
    Cooperative,
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

COOPERATIVES = [
    {
        "cle": "fifimava",
        "gare_code": "asabotsy",
        "nom": "FIFIMAVA",
        "telephone": "034 01 234 56",
        "secretaire": "Rasoa Harisoa",
        "est_premium": False,
    },
    {
        "cle": "kofiam",
        "gare_code": "vatofotsy",
        "nom": "KOFIAM",
        "telephone": "033 02 345 67",
        "secretaire": "Rakoto Hery",
        "est_premium": False,
    },
    {
        "cle": "kotrafia",
        "gare_code": "vatofotsy",
        "nom": "Kotrafia",
        "telephone": "034 03 456 78",
        "secretaire": "Randrianasolo Voahangy",
        "est_premium": False,
    },
    {
        "cle": "kofiaf",
        "gare_code": "vatofotsy",
        "nom": "KOFIAF",
        "telephone": "032 04 567 89",
        "secretaire": "Rafanomezantsoa Lalao",
        "est_premium": False,
    },
]

TARIFS = {
    "Antananarivo": 30000,
    "Fianarantsoa": 30000,
    "Mandoto": 10000,
    "Ankazomiritra": 10000,
    "Majunga": 40000,
}

PROGRAMME = {
    "asabotsy": [
        {
            "matricule": "1234 TBA",
            "destination": "Betafo",
            "chauffeur": "Rakoto Jean",
            "chauffeur_telephone": "034 11 234 56",
            "cooperative": "fifimava",
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
            "chauffeur_telephone": "033 22 345 67",
            "cooperative": "fifimava",
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
            "chauffeur_telephone": "032 33 456 78",
            "cooperative": "fifimava",
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
            "chauffeur_telephone": "034 44 567 89",
            "cooperative": "fifimava",
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
            "chauffeur_telephone": "033 55 678 90",
            "cooperative": "fifimava",
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
            "chauffeur_telephone": "032 66 789 01",
            "cooperative": "fifimava",
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
            "chauffeur_telephone": "034 77 890 12",
            "cooperative": "kofiam",
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
            "chauffeur_telephone": "033 88 901 23",
            "cooperative": "kofiam",
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
            "chauffeur_telephone": "032 99 012 34",
            "cooperative": "kotrafia",
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
            "chauffeur_telephone": "034 10 123 45",
            "cooperative": "kotrafia",
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
            "chauffeur_telephone": "033 21 234 56",
            "cooperative": "kofiaf",
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
            "chauffeur_telephone": "032 32 345 67",
            "cooperative": "kofiaf",
            "capacite": 20,
            "heure": time(14, 30),
            "prix": 12000,
            "duree": 150,
            "remplissage_demo": 8,
        },
        {
            "matricule": "9081 TCG",
            "destination": "Majunga",
            "chauffeur": "Rakotomalala Tojo",
            "chauffeur_telephone": "034 43 456 78",
            "cooperative": "kotrafia",
            "capacite": 28,
            "heure": time(10, 0),
            "prix": 40000,
            "duree": 360,
            "remplissage_demo": 21,
        },
        {
            "matricule": "1836 TCH",
            "destination": "Majunga",
            "chauffeur": "Randriamihaja Fidy",
            "chauffeur_telephone": "033 54 567 89",
            "cooperative": "kofiaf",
            "capacite": 28,
            "heure": time(16, 0),
            "prix": 40000,
            "duree": 360,
            "remplissage_demo": 12,
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


def _seed_cooperatives(
    session: Session, gares: dict[str, Gare]
) -> dict[str, Cooperative]:
    resultat: dict[str, Cooperative] = {}
    for donnees in COOPERATIVES:
        gare = gares[donnees["gare_code"]]
        cooperative = session.exec(
            select(Cooperative).where(
                Cooperative.gare_id == gare.id,
                Cooperative.nom == donnees["nom"],
            )
        ).first()
        if cooperative is None:
            cooperative = Cooperative(
                gare_id=gare.id,
                nom=donnees["nom"],
                telephone=donnees["telephone"],
                secretaire=donnees["secretaire"],
                est_premium=donnees["est_premium"],
            )
            session.add(cooperative)
            session.commit()
            session.refresh(cooperative)
        else:
            changements = False
            for champ in ("telephone", "secretaire", "est_premium"):
                if getattr(cooperative, champ) != donnees[champ]:
                    setattr(cooperative, champ, donnees[champ])
                    changements = True
            if changements:
                session.add(cooperative)
                session.commit()
                session.refresh(cooperative)
        resultat[donnees["cle"]] = cooperative
    return resultat


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


def _maj_vehicules_cooperatives(
    session: Session,
    gares: dict[str, Gare],
    cooperatives: dict[str, Cooperative],
) -> None:
    """Rattache les véhicules de démonstration à leur coopérative."""
    for code_gare, courses in PROGRAMME.items():
        gare = gares[code_gare]
        for course in courses:
            cooperative = cooperatives[course["cooperative"]]
            vehicules = session.exec(
                select(Vehicule).where(
                    Vehicule.gare_id == gare.id,
                    Vehicule.matricule == course["matricule"],
                )
            ).all()
            for vehicule in vehicules:
                vehicule.cooperative_id = cooperative.id
                vehicule.chauffeur = course["chauffeur"]
                vehicule.chauffeur_telephone = course["chauffeur_telephone"]
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


def _creer_programme(
    session: Session,
    gares: dict[str, Gare],
    cooperatives: dict[str, Cooperative],
    aujourd_hui: date,
) -> None:
    for decalage in range(4):
        jour = aujourd_hui + timedelta(days=decalage)
        for code_gare, courses in PROGRAMME.items():
            gare = gares[code_gare]
            for course in courses:
                cooperative = cooperatives[course["cooperative"]]
                parti = decalage == 0 and course.get("parti", False)
                vehicule = Vehicule(
                    gare_id=gare.id,
                    cooperative_id=cooperative.id,
                    matricule=course["matricule"],
                    destination=course["destination"],
                    chauffeur=course["chauffeur"],
                    chauffeur_telephone=course["chauffeur_telephone"],
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


def seed_database(session: Session) -> None:
    """Crée et met à jour les données de démonstration."""
    gares = _seed_gares(session)
    _seed_responsables(session, gares)
    cooperatives = _seed_cooperatives(session, gares)
    _maj_tarifs(session)

    aujourd_hui = date.today()
    programme_du_jour = session.exec(
        select(Vehicule).where(Vehicule.date_depart == aujourd_hui)
    ).first()
    if programme_du_jour is None:
        _creer_programme(session, gares, cooperatives, aujourd_hui)

    _maj_vehicules_cooperatives(session, gares, cooperatives)
