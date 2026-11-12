import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Route,
  ShieldCheck,
  Ticket,
  User,
  Users,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { PageLoader, Spinner } from '../components/Loading'
import PaymentMethodPicker, {
  libelleMoyen,
} from '../components/PaymentMethodPicker'
import {
  clamp,
  formatDateLongue,
  formatDuration,
  formatPrice,
  getErrorMessage,
  nomGare,
} from '../utils/format'

export default function BookingPage() {
  const { vehiculeId } = useParams()
  const navigate = useNavigate()
  const [vehicule, setVehicule] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreurChargement, setErreurChargement] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [moyenPaiement, setMoyenPaiement] = useState('mvola')
  const [places, setPlaces] = useState(1)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    let actif = true
    setChargement(true)
    api
      .getVehicle(vehiculeId)
      .then((donnees) => {
        if (actif) setVehicule(donnees)
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
  }, [vehiculeId])

  const maximum = useMemo(
    () => Math.min(20, Math.max(1, vehicule?.places_restantes || 1)),
    [vehicule],
  )

  const total = (vehicule?.prix || 0) * places
  const indisponible =
    vehicule && (vehicule.statut !== 'en_attente' || vehicule.places_restantes <= 0)

  async function soumettre(event) {
    event.preventDefault()
    setErreur('')
    if (nom.trim().length < 2) {
      setErreur('Veuillez saisir votre nom complet.')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setErreur('Veuillez saisir une adresse email valide.')
      return
    }
    if (!/^[0-9+][0-9 .-]{5,19}$/.test(telephone.trim())) {
      setErreur('Veuillez saisir un numéro de téléphone valide.')
      return
    }
    if (places < 1 || places > maximum) {
      setErreur(`Choisissez entre 1 et ${maximum} place(s).`)
      return
    }
    setEnvoi(true)
    try {
      const reservation = await api.createReservation({
        vehicule_id: vehicule.id,
        nom_passager: nom.trim(),
        email_passager: email.trim(),
        telephone_passager: telephone.trim(),
        nombre_places: places,
        moyen_paiement: moyenPaiement,
      })
      navigate(`/paiement/${reservation.code_qr}`, {
        state: { moyenPaiement },
        replace: true,
      })
    } catch (error) {
      setErreur(getErrorMessage(error))
    } finally {
      setEnvoi(false)
    }
  }

  if (chargement) {
    return <PageLoader label="Préparation de votre réservation…" />
  }

  if (erreurChargement || !vehicule) {
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-2xl p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-primary-900">
            Départ introuvable
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {erreurChargement || 'Ce départ n’existe plus.'}
          </p>
          <Link to="/" className="btn-primary mt-6">
            Retour à la recherche
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-paper">
      <div className="container-page py-8 lg:py-12">
        <Link
          to={`/recherche?gare=${vehicule.gare_id}&destination=${encodeURIComponent(vehicule.destination)}&date=${vehicule.date_depart}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-primary-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux résultats
        </Link>

        <div className="mt-5 grid gap-7 lg:grid-cols-[1fr_370px] lg:items-start">
          <div>
            <div className="mb-6">
              <span className="eyebrow">Réservation</span>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl">
                Réservez votre place
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
                Renseignez le voyageur principal, son email et son téléphone.
                Le QR code ne sera généré qu’après la confirmation du paiement.
              </p>
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 bg-primary-900 p-5 text-white sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary-300">
                      <MapPin className="h-3.5 w-3.5 text-sun-500" />
                      {nomGare(vehicule.gare?.nom)}
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-bold">
                      {vehicule.destination}
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-primary-200">
                      {formatDateLongue(vehicule.date_depart)} · Départ estimé{' '}
                      {vehicule.creneau}
                    </p>
                  </div>
                  <span className="rounded-xl bg-white/10 px-3 py-2 text-right">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-primary-300">
                      Prix / place
                    </span>
                    <span className="mt-0.5 block text-sm font-extrabold text-sun-400">
                      {formatPrice(vehicule.prix)}
                    </span>
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-primary-200">
                  {vehicule.cooperative && (
                    <span className="inline-flex items-center gap-1.5 text-sun-400">
                      <Building2 className="h-3.5 w-3.5" />
                      Coopérative {vehicule.cooperative.nom}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(vehicule.duree_minutes)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Route className="h-3.5 w-3.5" />
                    {vehicule.matricule}
                  </span>
                  <span>{vehicule.chauffeur}</span>
                </div>
              </div>

              {indisponible ? (
                <div className="p-6 text-center">
                  <p className="text-sm font-semibold text-accent-600">
                    Ce départ n’est plus disponible à la réservation.
                  </p>
                  <Link to="/departs" className="btn-primary mt-5">
                    Voir les autres départs
                  </Link>
                </div>
              ) : (
                <form onSubmit={soumettre} className="p-5 sm:p-6">
                  <div>
                    <label htmlFor="nom-passager" className="label">
                      Nom complet du passager
                    </label>
                    <div className="relative">
                      <User className="field-icon" />
                      <input
                        id="nom-passager"
                        type="text"
                        className="input pl-11"
                        placeholder="Ex. Miora Rakoto"
                        value={nom}
                        onChange={(event) => setNom(event.target.value)}
                        maxLength={160}
                        autoComplete="name"
                        required
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Ce nom figurera sur le billet numérique et lors du scan.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="email-passager" className="label">
                        Adresse email
                      </label>
                      <div className="relative">
                        <Mail className="field-icon" />
                        <input
                          id="email-passager"
                          type="email"
                          className="input pl-11"
                          placeholder="vous@exemple.mg"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          maxLength={160}
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="telephone-passager" className="label">
                        Numéro de téléphone
                      </label>
                      <div className="relative">
                        <Phone className="field-icon" />
                        <input
                          id="telephone-passager"
                          type="tel"
                          className="input pl-11"
                          placeholder="034 00 000 00"
                          value={telephone}
                          onChange={(event) => setTelephone(event.target.value)}
                          maxLength={40}
                          autoComplete="tel"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <span className="label">Nombre de places</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm">
                        <button
                          type="button"
                          className="flex h-11 w-11 items-center justify-center rounded-l-xl text-slate-500 transition hover:bg-slate-50 disabled:opacity-35"
                          onClick={() => setPlaces((valeur) => clamp(valeur - 1, 1, maximum))}
                          disabled={places <= 1}
                          aria-label="Retirer une place"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-lg font-extrabold text-primary-900">
                          {places}
                        </span>
                        <button
                          type="button"
                          className="flex h-11 w-11 items-center justify-center rounded-r-xl text-slate-500 transition hover:bg-slate-50 disabled:opacity-35"
                          onClick={() => setPlaces((valeur) => clamp(valeur + 1, 1, maximum))}
                          disabled={places >= maximum}
                          aria-label="Ajouter une place"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <Users className="h-3.5 w-3.5" />
                        {maximum} place{maximum > 1 ? 's' : ''} encore disponible
                        {maximum > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <span className="label">Moyen de paiement</span>
                    <PaymentMethodPicker
                      value={moyenPaiement}
                      onChange={setMoyenPaiement}
                    />
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                      Le QR code n’est délivré qu’après la validation du
                      paiement ({libelleMoyen(moyenPaiement)}).
                    </p>
                  </div>

                  {erreur && (
                    <div
                      role="alert"
                      className="mt-5 rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-700"
                    >
                      {erreur}
                    </div>
                  )}

                  <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      Billet QR sécurisé et unique
                    </p>
                    <button type="submit" className="btn-primary px-6" disabled={envoi}>
                      {envoi ? (
                        <>
                          <Spinner className="h-4 w-4" />
                          Réservation…
                        </>
                      ) : (
                        <>
                          Continuer vers le paiement
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
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
                      Aperçu du billet
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
                    {nomGare(vehicule.gare?.nom)} → {vehicule.destination}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-400">Date</span>
                  <span className="text-right font-semibold text-slate-600">
                    {formatDateLongue(vehicule.date_depart)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-400">Départ prévu</span>
                  <span className="text-right font-semibold text-slate-600">
                    {vehicule.creneau}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-400">Places</span>
                  <span className="font-bold text-primary-900">{places}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-400">Prix unitaire</span>
                  <span className="font-semibold text-slate-600">
                    {formatPrice(vehicule.prix)}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-sm font-bold text-primary-900">Total</span>
                    <span className="font-display text-2xl font-extrabold text-accent-500">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <p className="mt-1 text-right text-[10px] text-slate-400">
                    Paiement en ligne sécurisé · QR après paiement
                  </p>
                </div>
              </div>

              <div className="bg-primary-50 px-5 py-4">
                <p className="flex items-start gap-2 text-[11px] leading-relaxed text-primary-700">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Votre place est bloquée dès validation. Finalisez le paiement
                  pour recevoir le QR code du billet.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
