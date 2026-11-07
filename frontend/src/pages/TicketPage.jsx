import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Mail,
  MapPin,
  Phone,
  Printer,
  QrCode,
  Route,
  ShieldCheck,
  Ticket,
  Users,
  XCircle,
} from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api, ticketPdfUrl, ticketQrUrl } from '../api/client'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { PageLoader, Spinner } from '../components/Loading'
import {
  formatDateHeure,
  formatDateLongue,
  formatPrice,
  getErrorMessage,
  nomGare,
} from '../utils/format'

export default function TicketPage() {
  const { code } = useParams()
  const location = useLocation()
  const [reservation, setReservation] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [modalAnnuler, setModalAnnuler] = useState(false)
  const [annulationEnCours, setAnnulationEnCours] = useState(false)
  const [erreurAnnulation, setErreurAnnulation] = useState('')
  const nouvelleReservation = Boolean(location.state?.nouvelleReservation)

  async function confirmerAnnulation() {
    setAnnulationEnCours(true)
    setErreurAnnulation('')
    try {
      const reponse = await api.annulerReservation(code)
      setReservation(reponse.reservation)
      setModalAnnuler(false)
    } catch (error) {
      setErreurAnnulation(getErrorMessage(error))
    } finally {
      setAnnulationEnCours(false)
    }
  }

  useEffect(() => {
    let actif = true
    setChargement(true)
    api
      .getReservation(code)
      .then((donnees) => {
        if (actif) setReservation(donnees)
      })
      .catch((error) => {
        if (actif) setErreur(getErrorMessage(error))
      })
      .finally(() => {
        if (actif) setChargement(false)
      })
    return () => {
      actif = false
    }
  }, [code])

  if (chargement) {
    return <PageLoader label="Chargement de votre billet…" />
  }

  if (erreur || !reservation) {
    return (
      <div className="container-page py-20">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold text-primary-900">
            Billet introuvable
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {erreur || 'Ce code de réservation ne correspond à aucun billet.'}
          </p>
          <Link to="/" className="btn-primary mt-6">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    )
  }

  const vehicule = reservation.vehicule
  const annule =
    reservation.statut === 'annule' || vehicule?.statut === 'annule'
  const embarque = reservation.statut === 'embarque'
  const paye = reservation.payment_status === 'paye'
  const paiementEnAttente = reservation.paiement_requis && !annule
  const qrDisponible = reservation.qr_disponible && !annule

  return (
    <div className="bg-paper">
      <div className="container-page py-8 lg:py-12">
        <div className="no-print flex flex-wrap items-center justify-between gap-4">
          <Link
            to={vehicule ? `/recherche?gare=${vehicule.gare?.id}&date=${vehicule.date_depart}` : '/'}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-primary-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux départs
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Billet numérique sécurisé
          </span>
        </div>

        {nouvelleReservation && !annule && paye && (
          <div className="animate-fade-up mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-extrabold text-emerald-800">
                Réservation et paiement confirmés
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-emerald-700">
                Votre billet est prêt. Présentez le QR code ci-dessous à
                l’embarquement.
              </p>
            </div>
          </div>
        )}

        {paiementEnAttente && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-extrabold text-amber-900">
                  Paiement requis
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                  Votre QR code sera généré dès que le paiement sera finalisé.
                  Sans paiement, le billet ne peut pas être scanné.
                </p>
              </div>
            </div>
            <Link
              to={`/paiement/${reservation.code_qr}`}
              className="btn-primary shrink-0"
            >
              Payer maintenant
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {annule && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-accent-100 bg-accent-50 px-4 py-3.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
            <div>
              <p className="text-sm font-extrabold text-accent-700">
                Ce billet a été annulé
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-accent-600">
                {reservation.payment_status === 'rembourse'
                  ? 'Annulation enregistrée. Le paiement sera remboursé selon le moyen utilisé.'
                  : 'Le départ a été annulé. Ce billet ne permet plus d’embarquer.'}
              </p>
            </div>
          </div>
        )}

        {embarque && !annule && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-extrabold text-emerald-800">
                Embarquement validé
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-emerald-700">
                Ce billet a déjà été scanné par l’agent de gare.
              </p>
            </div>
          </div>
        )}

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
            <div className="relative overflow-hidden bg-primary-900 px-6 py-6 text-white sm:px-8">
              <div className="absolute inset-0 bg-dot-grid opacity-[0.1]" />
              <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-sun-500 via-accent-500 to-primary-500" />
              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary-300">
                    <Ticket className="h-4 w-4 text-sun-500" />
                    Billet de voyage
                  </div>
                  <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
                    {vehicule?.destination}
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-primary-200">
                    {nomGare(vehicule?.gare?.nom)}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge statut={reservation.statut} className="bg-white/10 text-white" />
                  <p className="mt-2 font-mono text-[10px] tracking-wider text-primary-300">
                    {reservation.code_qr}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative px-6 py-6 sm:px-8">
              <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                    Passager principal
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-primary-900">
                    {reservation.nom_passager}
                  </p>

                  <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    <div>
                      <dt className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        Date
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-primary-900">
                        {formatDateLongue(vehicule?.date_depart)}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        Départ estimé
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-primary-900">
                        {vehicule?.creneau}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <Route className="h-3.5 w-3.5" />
                        Véhicule · chauffeur
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-600">
                        {vehicule?.matricule} · {vehicule?.chauffeur}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <Users className="h-3.5 w-3.5" />
                        Places réservées
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-primary-900">
                        {reservation.nombre_places}{' '}
                        {reservation.nombre_places > 1 ? 'places' : 'place'}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </dt>
                      <dd className="mt-1 truncate text-sm font-semibold text-slate-600">
                        {reservation.email_passager || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <Phone className="h-3.5 w-3.5" />
                        Téléphone
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-600">
                        {reservation.telephone_passager || '—'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  {qrDisponible ? (
                    <img
                      src={ticketQrUrl(reservation.code_qr)}
                      alt={`QR code du billet ${reservation.code_qr}`}
                      className="h-40 w-40 rounded-lg bg-white p-1.5"
                    />
                  ) : (
                    <div className="flex h-40 w-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 text-center">
                      <QrCode className="h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-[10px] font-bold leading-relaxed text-slate-400">
                        QR code disponible après paiement
                      </p>
                    </div>
                  )}
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <QrCode className="h-3 w-3" />
                    {qrDisponible
                      ? 'Scan à l’embarquement'
                      : 'Paiement en attente'}
                  </p>
                </div>
              </div>

              <div className="relative mt-7 border-t border-dashed border-slate-200 pt-5">
                <span className="absolute -left-[34px] -top-3 h-6 w-6 rounded-full bg-paper sm:-left-[42px]" />
                <span className="absolute -right-[34px] -top-3 h-6 w-6 rounded-full bg-paper sm:-right-[42px]" />
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      {paye ? 'Total payé' : 'Total à payer'}
                    </p>
                    <p className="mt-1 font-display text-3xl font-extrabold text-accent-500">
                      {formatPrice(reservation.total)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {paye
                        ? `Payé via ${reservation.payment_method_label || reservation.payment_method || 'un moyen en ligne'}`
                        : 'Paiement en ligne requis avant le QR code'}
                    </p>
                  </div>
                  <p className="max-w-[220px] text-right text-[10px] leading-relaxed text-slate-400">
                    Valable uniquement pour le départ indiqué. Conservez ce
                    billet jusqu’à l’arrivée.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="no-print space-y-5 lg:sticky lg:top-28">
            <div className="card p-5">
              <h2 className="font-display text-lg font-bold text-primary-900">
                Votre billet
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Téléchargez le billet PDF pour le conserver hors ligne ou
                l’imprimer avant le voyage.
              </p>
              <div className="mt-5 space-y-3">
                {paye ? (
                  <>
                    <a
                      href={ticketPdfUrl(reservation.code_qr)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary w-full"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger en PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="btn-secondary w-full"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimer le billet
                    </button>
                  </>
                ) : (
                  <Link
                    to={`/paiement/${reservation.code_qr}`}
                    className="btn-primary w-full"
                  >
                    <CreditCard className="h-4 w-4" />
                    Payer pour recevoir le QR
                  </Link>
                )}
              </div>
            </div>

            {!annule && !embarque && (
              <div className="card p-5">
                <h2 className="font-display text-lg font-bold text-primary-900">
                  Annulation
                </h2>
                {reservation.annulable ? (
                  <>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      Vous pouvez annuler gratuitement jusqu’au{' '}
                      <strong>
                        {formatDateHeure(reservation.annulation_limite)}
                      </strong>
                      . Après ce délai, le billet n’est plus remboursable.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setErreurAnnulation('')
                        setModalAnnuler(true)
                      }}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-accent-100 bg-white px-4 py-2.5 text-sm font-bold text-accent-600 transition hover:bg-accent-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Annuler mon voyage
                    </button>
                  </>
                ) : (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    Le délai d’annulation est dépassé ou le départ n’est plus
                    modifiable. Le billet est désormais non remboursable.
                  </p>
                )}
              </div>
            )}

            <div className="rounded-2xl bg-primary-900 p-5 text-white">
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-sun-400">
                <MapPin className="h-3.5 w-3.5" />
                À l’embarquement
              </div>
              <ol className="mt-4 space-y-4 text-xs leading-relaxed text-primary-200">
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-extrabold text-white">
                    1
                  </span>
                  Rendez-vous à la gare au début du créneau indiqué.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-extrabold text-white">
                    2
                  </span>
                  Présentez le QR code ou le PDF à l’agent.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-extrabold text-white">
                    3
                  </span>
                  L’embarquement est validé dès le scan du billet.
                </li>
              </ol>
              <Link
                to="/admin/scan"
                className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-sun-400 transition hover:text-sun-500"
              >
                Espace agent de gare
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <p className="px-2 text-center text-[10px] leading-relaxed text-slate-400">
              Les départs sont prévisionnels et déclenchés par le responsable de
              la gare selon le remplissage du véhicule.
            </p>
          </aside>
        </div>
      </div>

      <Modal
        open={modalAnnuler}
        onClose={() => (annulationEnCours ? null : setModalAnnuler(false))}
        title="Annuler mon voyage"
        description="Le billet sera invalidé et le paiement remboursé si nécessaire."
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-accent-50 px-4 py-3 text-xs leading-relaxed text-accent-700">
            Votre départ vers <strong>{vehicule?.destination}</strong> du{' '}
            {formatDateLongue(vehicule?.date_depart)} sera annulé. Cette action
            est définitive.
          </div>
          {erreurAnnulation && (
            <p className="rounded-xl bg-accent-50 px-4 py-3 text-xs font-semibold text-accent-700">
              {erreurAnnulation}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalAnnuler(false)}
              disabled={annulationEnCours}
            >
              Garder mon billet
            </button>
            <button
              type="button"
              className="btn-accent"
              onClick={confirmerAnnulation}
              disabled={annulationEnCours}
            >
              {annulationEnCours ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Annulation…
                </>
              ) : (
                'Confirmer l’annulation'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
