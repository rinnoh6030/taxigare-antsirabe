import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  MapPin,
  ShieldCheck,
  Ticket,
} from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { PageLoader, Spinner } from '../components/Loading'
import PaymentMethodPicker, {
  libelleMoyen,
} from '../components/PaymentMethodPicker'
import {
  formatDateLongue,
  formatPrice,
  getErrorMessage,
  nomGare,
} from '../utils/format'

export default function PaymentPage() {
  const { code } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [reservation, setReservation] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')
  const [moyen, setMoyen] = useState(
    location.state?.moyenPaiement || 'mvola',
  )
  const [paiementEnCours, setPaiementEnCours] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  useEffect(() => {
    let actif = true
    api
      .getReservation(code)
      .then((donnees) => {
        if (!actif) return
        setReservation(donnees)
        if (donnees.payment_method) setMoyen(donnees.payment_method)
      })
      .catch((error) => {
        if (actif) setErreurChargement(getErrorMessage(error))
      })
      .finally(() => {
        if (actif) setChargement(false)
      })
    return () => {
      actif = false
    }
  }, [code])

  async function payer() {
    setErreur('')
    setPaiementEnCours(true)
    try {
      const reponse = await api.payerReservation(code, moyen)
      setReservation(reponse.reservation)
      setSucces(true)
    } catch (error) {
      setErreur(getErrorMessage(error))
    } finally {
      setPaiementEnCours(false)
    }
  }

  if (chargement) {
    return <PageLoader label="Préparation du paiement…" />
  }

  if (erreurChargement || !reservation) {
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-accent-500" />
          <h1 className="mt-4 font-display text-2xl font-bold text-primary-900">
            Réservation introuvable
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {erreurChargement || 'Ce code de réservation est inconnu.'}
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
  const dejaPaye = reservation.payment_status === 'paye'

  if (annule) {
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-accent-500" />
          <h1 className="mt-4 font-display text-2xl font-bold text-primary-900">
            Réservation annulée
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Cette réservation a été annulée. Aucun paiement ne peut être
            effectué.
          </p>
          <Link to="/" className="btn-primary mt-6">
            Rechercher un autre départ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-paper">
      <div className="container-page py-8 lg:py-12">
        <Link
          to={`/ticket/${reservation.code_qr}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-primary-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au billet
        </Link>

        <div className="mt-5 grid gap-7 lg:grid-cols-[1fr_370px] lg:items-start">
          <div>
            <div className="mb-6">
              <span className="eyebrow">Paiement sécurisé</span>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl">
                Finalisez votre paiement
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
                Votre QR code sera généré dès la confirmation du paiement.
                Choisissez votre moyen de paiement préféré.
              </p>
            </div>

            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-primary-900 px-5 py-4 text-white sm:px-6">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary-300">
                  <Lock className="h-3.5 w-3.5 text-sun-500" />
                  Paiement avant billet
                </div>
                <span className="font-mono text-[10px] tracking-wider text-primary-300">
                  {reservation.code_qr}
                </span>
              </div>

              {succes ? (
                <div className="p-6 text-center sm:p-8">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                    <CheckCircle2 className="h-8 w-8" />
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-extrabold text-emerald-900">
                    Paiement confirmé
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Votre billet est prêt. Le QR code est maintenant disponible.
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {libelleMoyen(reservation.payment_method)} ·{' '}
                    {formatPrice(reservation.total)}
                  </p>
                  <button
                    type="button"
                    className="btn-primary mt-6"
                    onClick={() =>
                      navigate(`/ticket/${reservation.code_qr}`, {
                        state: { nouvelleReservation: true },
                        replace: true,
                      })
                    }
                  >
                    Voir mon billet
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="p-5 sm:p-6">
                  {dejaPaye ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                      Ce billet est déjà payé. Votre QR code est disponible.
                    </div>
                  ) : (
                    <>
                      <span className="label">Choisir un moyen de paiement</span>
                      <PaymentMethodPicker value={moyen} onChange={setMoyen} />

                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-slate-500">Montant à payer</span>
                          <span className="font-display text-2xl font-extrabold text-accent-500">
                            {formatPrice(reservation.total)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {reservation.nombre_places}{' '}
                          {reservation.nombre_places > 1 ? 'places' : 'place'} ·{' '}
                          {libelleMoyen(moyen)}
                        </p>
                      </div>

                      {erreur && (
                        <div
                          role="alert"
                          className="mt-4 rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-700"
                        >
                          {erreur}
                        </div>
                      )}

                      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          Paiement de démonstration · aucun débit réel
                        </p>
                        <button
                          type="button"
                          onClick={payer}
                          className="btn-primary px-6"
                          disabled={paiementEnCours}
                        >
                          {paiementEnCours ? (
                            <>
                              <Spinner className="h-4 w-4" />
                              Paiement en cours…
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4" />
                              Payer {formatPrice(reservation.total)}
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}

                  {dejaPaye && (
                    <button
                      type="button"
                      className="btn-primary mt-5"
                      onClick={() => navigate(`/ticket/${reservation.code_qr}`)}
                    >
                      Voir mon billet
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="border-b border-dashed border-slate-200 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sun-100 text-primary-800">
                    <Ticket className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      Récapitulatif
                    </p>
                    <p className="text-xs font-bold text-primary-900">
                      Réservation numérique
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-400">Trajet</span>
                  <span className="text-right font-bold text-primary-900">
                    {nomGare(vehicule?.gare?.nom)} → {vehicule?.destination}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-400">Passager</span>
                  <span className="text-right font-semibold text-slate-600">
                    {reservation.nom_passager}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-400">Date</span>
                  <span className="text-right font-semibold text-slate-600">
                    {formatDateLongue(vehicule?.date_depart)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-400">Départ prévu</span>
                  <span className="inline-flex items-center gap-1.5 text-right font-semibold text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {vehicule?.creneau}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-400">Places</span>
                  <span className="font-bold text-primary-900">
                    {reservation.nombre_places}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-sm font-bold text-primary-900">
                      Total
                    </span>
                    <span className="font-display text-2xl font-extrabold text-accent-500">
                      {formatPrice(reservation.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-primary-50 px-5 py-4">
                <p className="flex items-start gap-2 text-[11px] leading-relaxed text-primary-700">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Présentez le QR code à l’agent de gare au moment de
                  l’embarquement.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
