# TaxiGare Antsirabe

Application de gestion des départs au remplissage pour les gares routières
d’Asabotsy et de Vatofotsy à Antsirabe.

Le voyageur recherche un départ, réserve une place et reçoit un billet avec QR
code. Le responsable de gare suit le remplissage en temps réel, ajuste le nombre
de passagers et valide le départ. À l’embarquement, le billet est scanné et ne
peut plus être réutilisé.

## Fonctionnalités

- Recherche publique par gare, coopérative, destination et date. Les
  coopératives de Vatofotsy (KOFIAM, Kotrafia, KOFIAF) sont mises en avant sur
  l’accueil et filtrables dans les résultats et le tableau des départs.
- Réservation avec email et téléphone, puis paiement en ligne (MVola, Airtel
  Money, Orange Money, carte bancaire, PayPal, Bitcoin) avant génération du QR.
- Code unique, QR code et billet PDF disponibles uniquement après paiement.
- Annulation par le voyageur dans un délai configurable (2 h avant le départ),
  avec remboursement automatique au-delà du paiement.
- Annulation d’une réservation par le responsable de gare (demande téléphonique
  du passager, erreur de saisie…) avec libération immédiate des places et
  remboursement automatique si le billet était payé.
- Tableau public des départs actualisé toutes les 30 secondes.
- Seuils différenciés : 70 % pour Asabotsy, 90 % pour Vatofotsy.
- Détection des départs prêts et possibilité de forcer un départ anticipé.
- Espace responsable avec authentification JWT et cloisonnement par gare.
- Notifications en temps réel des nouvelles réservations dans le back-office.
- Graphiques : taux de remplissage des 7 prochains jours et destinations les
  plus populaires.
- Gestion des véhicules, des passagers à bord, des départs et des annulations.
- Scan caméra ou saisie manuelle réservé aux responsables connectés, avec refus
  des doublons et vérification du paiement.
- Interface responsive et états de chargement/erreur explicites.

## Stack

| Partie | Technologies |
| --- | --- |
| API | Python, FastAPI, SQLModel, SQLite, JWT, ReportLab, qrcode |
| Frontend | React, Vite, React Router, Tailwind CSS, Lucide, Recharts, html5-qrcode |
| Déploiement | Render (Web Service Python + Static Site) |

## Structure

```text
.
├── backend/
│   ├── main.py              # Application FastAPI et initialisation
│   ├── models.py            # Tables SQLModel et statuts
│   ├── schemas.py           # Validation des requêtes
│   ├── security.py          # JWT et hachage des mots de passe
│   ├── seed.py              # Données de démonstration
│   ├── tickets.py           # QR codes et PDF
│   └── routers/             # Routes publiques, auth et back-office
├── frontend/
│   ├── src/pages/           # Pages publiques et espace responsable
│   ├── src/components/      # Layouts, formulaires, scanner, etc.
│   ├── src/api/client.js    # Client API et gestion du token
│   └── src/App.jsx          # Table de routage
├── render.yaml              # Blueprint Render
└── README.md
```

## Démarrage local

Prérequis : Python 3.11+ et Node.js 20.19+.

### 1. API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --env-file .env
```

L’API écoute sur `http://localhost:8000`.

- Documentation OpenAPI : `http://localhost:8000/docs`
- Santé : `http://localhost:8000/api/health`

La base SQLite `backend/gare.db` et les données de démonstration sont créées au
premier démarrage. Le seed ne remplace pas une base déjà remplie.

### 2. Frontend

Dans un second terminal :

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

L’application est disponible sur `http://localhost:5173`.

Pour utiliser une autre API :

```dotenv
VITE_API_URL=http://localhost:8000
```

L’URL peut être fournie avec ou sans `/api` et avec ou sans protocole.

## Comptes de démonstration

| Gare | Email | Mot de passe | Seuil |
| --- | --- | --- | --- |
| Asabotsy | `asabotsy@taxigare.mg` | `asabotsy2026` | 70 % |
| Vatofotsy | `vatofotsy@taxigare.mg` | `vatofotsy2026` | 90 % |

Chaque responsable ne peut consulter et modifier que les véhicules de sa gare.

## Logique de départ

1. Une réservation augmente immédiatement les places réservées.
2. Le responsable peut saisir le nombre réel de passagers à bord.
3. Si le taux atteint le seuil de la gare, le départ est signalé comme prêt.
4. Sous le seuil, le responsable doit confirmer explicitement un départ
   anticipé.
5. Un départ annulé invalide automatiquement ses billets.
6. Le QR code et le PDF ne sont délivrés qu’après paiement (`402` sinon).
7. Le scan d’un billet le passe à « Embarqué » ; un second scan renvoie une
   erreur `409`.
8. Le scan exige un responsable connecté et le billet doit appartenir à sa gare.
9. Le voyageur peut annuler jusqu’à `ANNULATION_DELAI_HEURES` (2 h par défaut)
   avant le départ ; le paiement est alors marqué comme remboursé.

## Endpoints principaux

| Méthode | Route | Accès |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/gares` | Public |
| `GET` | `/api/gares/{id}/destinations` | Public |
| `GET` | `/api/recherche?gare_id=1&date=AAAA-MM-JJ` | Public |
| `GET` | `/api/departs-publics` | Public |
| `GET` | `/api/vehicules/{id}` | Public |
| `POST` | `/api/reservations` | Public |
| `GET` | `/api/reservations/{code}` | Public |
| `POST` | `/api/reservations/{code}/payer` | Public |
| `POST` | `/api/reservations/{code}/annuler` | Public |
| `GET` | `/api/reservations/{code}/qr.png` | Public (après paiement) |
| `GET` | `/api/reservations/{code}/ticket.pdf` | Public (après paiement) |
| `POST` | `/api/scan` | Responsable connecté |
| `GET` | `/api/backoffice/vehicules` | Responsable |
| `POST` | `/api/backoffice/vehicules` | Responsable |
| `PATCH` | `/api/backoffice/vehicules/{id}` | Responsable |
| `DELETE` | `/api/backoffice/vehicules/{id}` | Responsable |
| `POST` | `/api/backoffice/vehicules/{id}/depart` | Responsable |
| `POST` | `/api/backoffice/vehicules/{id}/annuler` | Responsable |
| `GET` | `/api/backoffice/notifications` | Responsable |
| `GET` | `/api/backoffice/statistiques` | Responsable |

## Déploiement sur Render

### Blueprint automatique

1. Poussez le projet dans un dépôt GitHub ou GitLab.
2. Dans Render, choisissez **New > Blueprint** et sélectionnez le dépôt.
3. Render détecte `render.yaml` et crée :
   - `taxigare-api` : API Python dans `backend/`.
   - `taxigare-frontend` : site statique Vite dans `frontend/`.
4. Validez le déploiement, puis ouvrez l’URL du site statique.

Le Blueprint configure automatiquement :

- `SECRET_KEY` généré aléatoirement ;
- `VITE_API_URL` avec l’URL du service API ;
- `FRONTEND_URL` et `CORS_ORIGINS` avec l’URL du site ;
- la réécriture SPA `/* → /index.html` pour React Router ;
- le contrôle de santé `/api/health`.

Les QR codes sont générés à partir de `FRONTEND_URL`. Si vous ajoutez un domaine
personnalisé, mettez à jour cette variable puis redéployez l’API.

### Configuration manuelle

Service API :

```text
Runtime: Python
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Health Check Path: /api/health
```

Variables : `SECRET_KEY`, `DATABASE_URL=sqlite:///./gare.db`,
`FRONTEND_URL=https://votre-frontend.onrender.com`,
`CORS_ORIGINS=https://votre-frontend.onrender.com`.

Site statique :

```text
Build Command: cd frontend && npm ci && npm run build
Publish Directory: frontend/dist
```

Variable : `VITE_API_URL=https://votre-api.onrender.com`.

Ajoutez une règle de réécriture de `/*` vers `/index.html`.

### Points d’attention en production

- Sur l’offre gratuite Render, le disque est éphémère : la base SQLite et les
  réservations sont réinitialisées à chaque redéploiement. Pour conserver les
  données, utilisez Render Postgres ou attachez un disque persistant.
- Le service gratuit peut s’endormir après une période d’inactivité. Le premier
  chargement peut alors prendre quelques dizaines de secondes.
- La caméra nécessite HTTPS. C’est automatiquement le cas sur Render.
- Le scan est réservé aux responsables authentifiés et limité aux billets de
  leur gare.
- Le paiement est simulé (aucun débit réel) mais le statut de paiement est
  persisté et conditionne la génération du QR code et l’embarquement. Branchez
  un prestataire réel (MVola, Orange, Airtel, Stripe, PayPal, etc.) dans
  `POST /api/reservations/{code}/payer` pour la production.
- Configurez `ANNULATION_DELAI_HEURES` pour ajuster le délai d’annulation.

## Vérifications

```bash
# Build de production du frontend
cd frontend
npm ci
npm run build

# Santé de l’API
curl http://localhost:8000/api/health
```

Le projet ne comporte pas encore de suite de tests automatisés. Les parcours
réservation, paiement, billet QR/PDF, scan authentifié, doublon, cloisonnement
par gare, connexion responsable, CRUD véhicules, départ forcé et annulation avec
remboursement ont été vérifiés manuellement.
