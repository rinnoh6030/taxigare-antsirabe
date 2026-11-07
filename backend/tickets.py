import io
from urllib.parse import quote

import qrcode
from qrcode.constants import ERROR_CORRECT_M
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A5, landscape
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from config import FRONTEND_URL
from models import Gare, Reservation, Vehicule
from serializers import format_creneau

BLEU = HexColor("#123B66")
BLEU_FONCE = HexColor("#0A2340")
ROUGE = HexColor("#D64545")
JAUNE = HexColor("#F2C94C")
GRIS = HexColor("#5C6672")
GRIS_CLAIR = HexColor("#E9EEF4")

MOIS_FR = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
]


def url_billet(code_qr: str) -> str:
    return f"{FRONTEND_URL}/ticket/{quote(code_qr)}"


def generer_qr_png(code_qr: str) -> bytes:
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=12,
        border=2,
    )
    qr.add_data(url_billet(code_qr))
    qr.make(fit=True)
    image = qr.make_image(fill_color="#0A2340", back_color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def date_longue_fr(valeur: str) -> str:
    annee, mois, jour = (int(partie) for partie in valeur.split("-"))
    return f"{jour} {MOIS_FR[mois - 1]} {annee}"


def _format_prix(valeur: int) -> str:
    return f"{valeur:,.0f}".replace(",", " ") + " Ar"


def construire_ticket_pdf(
    reservation: Reservation,
    vehicule: Vehicule,
    gare: Gare | None,
    qr_png: bytes,
) -> bytes:
    largeur, hauteur = landscape(A5)
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=(largeur, hauteur))
    pdf.setTitle(f"Billet TaxiGare - {reservation.code_qr}")

    marge = 12 * mm
    bande = 28 * mm

    # Bandeau supérieur aux couleurs des taxis-brousses
    pdf.setFillColor(BLEU_FONCE)
    pdf.rect(0, hauteur - bande, largeur, bande, fill=1, stroke=0)
    pdf.setFillColor(ROUGE)
    pdf.rect(0, hauteur - bande, 4, bande, fill=1, stroke=0)
    pdf.setFillColor(JAUNE)
    pdf.rect(3 * mm, hauteur - bande + 7 * mm, 36 * mm, 3, fill=1, stroke=0)

    pdf.setFillColor(white)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(marge, hauteur - 14 * mm, "TAXIGARE")
    pdf.setFont("Helvetica", 7)
    pdf.setFillColor(HexColor("#BFD2E7"))
    pdf.drawString(marge, hauteur - 19 * mm, "GARES ROUTIÈRES D'ANTSIRABE")
    pdf.setFont("Helvetica-Bold", 7)
    pdf.setFillColor(white)
    pdf.drawRightString(
        largeur - marge,
        hauteur - 14 * mm,
        "BILLET NUMÉRIQUE",
    )
    pdf.setFont("Helvetica", 6.5)
    pdf.setFillColor(HexColor("#BFD2E7"))
    pdf.drawRightString(
        largeur - marge,
        hauteur - 19 * mm,
        f"Réservation {reservation.code_qr}",
    )

    y = hauteur - bande - 16
    pdf.setFillColor(GRIS)
    pdf.setFont("Helvetica", 8)
    pdf.drawString(marge, y, "DESTINATION")
    pdf.setFillColor(BLEU_FONCE)
    pdf.setFont("Helvetica-Bold", 23)
    pdf.drawString(marge, y - 25, vehicule.destination)

    if gare:
        pdf.setFillColor(GRIS)
        pdf.setFont("Helvetica", 8)
        pdf.drawRightString(
            largeur - marge,
            y,
            f"GARE DE {gare.nom.upper()}",
        )

    pdf.setStrokeColor(GRIS_CLAIR)
    pdf.setLineWidth(0.8)
    pdf.line(marge, y - 36, largeur - marge, y - 36)

    colonne_gauche = marge
    colonne_milieu = marge + 62 * mm
    ligne_1 = y - 50
    ligne_2 = y - 80
    ligne_3 = y - 110

    def bloc(titre: str, valeur: str, x: float, position_y: float) -> None:
        pdf.setFillColor(GRIS)
        pdf.setFont("Helvetica", 6.5)
        pdf.drawString(x, position_y, titre.upper())
        pdf.setFillColor(BLEU_FONCE)
        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(x, position_y - 12.5, valeur[:38])

    bloc("Passager", reservation.nom_passager, colonne_gauche, ligne_1)
    bloc("Places", str(reservation.nombre_places), colonne_milieu, ligne_1)
    bloc("Date de départ", date_longue_fr(vehicule.date_depart.isoformat()), colonne_gauche, ligne_2)
    bloc("Créneau prévu", format_creneau(vehicule.heure_depart), colonne_milieu, ligne_2)
    bloc("Véhicule", f"{vehicule.matricule} · {vehicule.chauffeur}", colonne_gauche, ligne_3)

    # Bloc QR à droite
    qr_taille = 38 * mm
    qr_x = largeur - marge - qr_taille
    qr_y = 26 * mm
    pdf.setFillColor(GRIS_CLAIR)
    pdf.roundRect(qr_x - 3, qr_y - 3, qr_taille + 6, qr_taille + 6, 3, fill=1, stroke=0)
    pdf.drawImage(
        ImageReader(io.BytesIO(qr_png)),
        qr_x,
        qr_y,
        width=qr_taille,
        height=qr_taille,
        preserveAspectRatio=True,
        mask="auto",
    )
    pdf.setFillColor(GRIS)
    pdf.setFont("Helvetica", 6)
    pdf.drawCentredString(
        qr_x + qr_taille / 2,
        qr_y - 8,
        "Scannez ce QR code à l'embarquement",
    )

    pdf.setFillColor(BLEU)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(marge, 22 * mm, f"TOTAL : {_format_prix(vehicule.prix * reservation.nombre_places)}")
    pdf.setFillColor(GRIS)
    pdf.setFont("Helvetica", 7)
    pdf.drawString(
        marge,
        13 * mm,
        "Départ lorsque le véhicule est prêt · Présentez ce billet à l'agent de gare.",
    )

    pdf.setStrokeColor(JAUNE)
    pdf.setLineWidth(2)
    pdf.line(marge, 8 * mm, largeur - marge, 8 * mm)

    if reservation.statut == "annule" or vehicule.statut == "annule":
        pdf.setFillColor(ROUGE)
        pdf.setFont("Helvetica-Bold", 34)
        pdf.saveState()
        pdf.translate(largeur / 2, hauteur / 2)
        pdf.rotate(18)
        pdf.setFillAlpha(0.72)
        pdf.drawCentredString(0, 0, "ANNULÉ")
        pdf.restoreState()

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
