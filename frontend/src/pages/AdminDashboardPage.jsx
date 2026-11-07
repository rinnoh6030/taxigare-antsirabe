import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Save,
  ScanLine,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import OccupancyBar from '../components/OccupancyBar'
import StatusBadge from '../components/StatusBadge'
import { Spinner } from '../components/Loading'
import {
  dateDuJour,
  formatDateLongue,
  formatDateJour,
  getErrorMessage,
  nomGare,
  pluraliser,
} from '../utils/format'

const FILTRES = [
  { cle: 'en_attente', label: 'En attente' },
  { cle: 'parti', label: 'Partis' },
  { cle: 'annule', label: 'Annulés' },
  { cle: 'tous', label: 'Tous' },
]

function CarteVehiculeAdmin({ vehicule, onRefresh, onNotify }) {
  const [passagers, setPassagers] = useState(
    vehicule.passagers_a_bord === null ? '' : String(vehicule.passagers_a_bord),
  )
  const [enregistrement, setEnregistrement] = useState(false)
  const [action, setAction] = useState('')
  const [modalDepart, setModalDepart] = useState(false)
  const [modalAnnuler, setModalAnnuler] = useState(false)
  const [motif, setMotif] = useState('')
  const [erreurAction, setErreurAction] = useState('')

  useEffect(() => {
    setPassagers(
      vehicule.passagers_a_bord === null ? '' : String(vehicule.passagers_a_bord),
    )
  }, [vehicule.id, vehicule.passagers_a_bord])

  const enAttente = vehicule.statut === 'en_attente'
  const valeurSaisie =
    passagers === ''
      ? vehicule.passagers_a_bord ?? vehicule.places_reservees
      : Number(passagers)
  const occupation = Math.min(
    Math.max(Number.isFinite(valeurSaisie) ? valeurSaisie : 0, 0),
    vehicule.capacite,
  )
  const taux = Math.min(
    100,
    Math.round((occupation / Math.max(vehicule.capacite, 1)) * 100),
  )
  const pret = taux >= vehicule.seuil_remplissage
  const placesManquantes = Math.max(
    0,
    Math.ceil((vehicule.capacite * vehicule.seuil_remplissage) / 100) - occupation,
  )

  function validerPassagers() {
    if (passagers !== '') {
      const nombre = Number(passagers)
      if (
        !Number.isInteger(nombre) ||
        nombre < 0 ||
        nombre > vehicule.capacite
      ) {
        onNotify(
          'erreur',
          `Saisissez un nombre entier entre 0 et ${vehicule.capacite}.`,
        )
        return false
      }
    }
    return true
  }

  async function enregistrerPassagers(event) {
    event.preventDefault()
    if (!validerPassagers()) return
    setEnregistrement(true)
    try {
      await api.updateOccupation(
        vehicule.id,
        passagers === '' ? null : Number(passagers),
      )
      onNotify('succes', 'Passagers à bord mis à jour.')
      onRefresh()
    } catch (error) {
      onNotify('erreur', getErrorMessage(error))
    } finally {
      setEnregistrement(false)
    }
  }

  function ouvrirDepart() {
    if (!validerPassagers()) return
    setErreurAction('')
    setModalDepart(true)
  }

  async function confirmerDepart() {
    setAction('depart')
    setErreurAction('')
    try {
      await api.departVehicle(vehicule.id, {
        passagers_a_bord: passagers === '' ? null : Number(passagers),
        forcer: !pret,
      })
      setModalDepart(false)
      onNotify('succes', 'Départ validé. Le tableau public est à jour.')
      onRefresh()
    } catch (error) {
      setErreurAction(getErrorMessage(error))
    } finally {
      setAction('')
    }
  }

  async function confirmerAnnulation() {
    setAction('annuler')
    setErreurAction('')
    try {
      await api.cancelVehicle(vehicule.id, motif.trim())
      setModalAnnuler(false)
      onNotify('succes', 'Départ annulé et billets invalidés.')
      onRefresh()
    } catch (error) {
      setErreurAction(getErrorMessage(error))
    } finally {
      setAction('')
    }
  }

  return (
    <>
      <article
        className={`overflow-hidden rounded-2xl border bg-white shadow-soft transition ${
          vehicule.statut === 'annule'
            ? 'border-accent-100 opacity-80'
            : 'border-slate-200/80'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50">
              <span className="font-display text-sm font-extrabold text-primary-900">
                {vehicule.heure_depart}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-primary-400">
                prévu
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-bold text-primary-900">
                  {vehicule.destination}
                </h3>
                <span className="badge bg-slate-100 text-slate-500">
                  {vehicule.matricule}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {vehicule.chauffeur} · {vehicule.capacite} places
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                {formatDateJour(vehicule.date_depart)} · Créneau {vehicule.creneau}
              </p>
            </div>
          </div>
          <StatusBadge statut={vehicule.statut} />
        </div>

        <div className="grid gap-5 border-t border-slate-100 bg-slate-50/40 p-5 lg:grid-cols-[1.15fr_0.85fr_230px]">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                Remplissage effectif
              </span>
              <span className="text-xs font-extrabold text-primary-900">
                {occupation}/{vehicule.capacite} · {taux} %
              </span>
            </div>
            <OccupancyBar
              valeur={taux}
              seuil={vehicule.seuil_remplissage}
              className="h-2.5"
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-semibold">
              <span className={pret ? 'text-emerald-600' : 'text-amber-600'}>
                {pret
                  ? 'Seuil de départ atteint'
                  : `Encore ${placesManquantes} ${pluraliser('place', placesManquantes)}`}
              </span>
              <span className="text-slate-400">
                Seuil {vehicule.seuil_remplissage} %
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Réservations en ligne
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-primary-900">
                  {vehicule.places_reservees}{' '}
                  <span className="text-[10px] font-semibold text-slate-400">
                    / {vehicule.capacite}
                  </span>
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Passagers à bord
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-primary-900">
                  {vehicule.passagers_a_bord ?? 'Estimation'}
                </p>
              </div>
            </div>
          </div>

          <div>
            {enAttente ? (
              <form onSubmit={enregistrerPassagers}>
                <label
                  htmlFor={`passagers-${vehicule.id}`}
                  className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400"
                >
                  Saisir les passagers à bord
                </label>
                <div className="flex gap-2">
                  <input
                    id={`passagers-${vehicule.id}`}
                    type="number"
                    min="0"
                    max={vehicule.capacite}
                    step="1"
                    className="input h-[42px] py-2"
                    placeholder={`Auto (${vehicule.places_reservees})`}
                    value={passagers}
                    onChange={(event) => setPassagers(event.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn-secondary h-[42px] shrink-0 px-3"
                    disabled={enregistrement}
                    title="Enregistrer les passagers à bord"
                  >
                    {enregistrement ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                  Laissez vide pour utiliser l’estimation en ligne (
                  {vehicule.places_reservees} places).
                </p>
              </form>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Information
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {vehicule.statut === 'parti'
                    ? 'Le départ a été validé par le responsable de gare.'
                    : vehicule.cancellation_reason ||
                      'Ce départ a été annulé par le responsable de gare.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-end gap-2">
            {enAttente ? (
              <>
                <button
                  type="button"
                  onClick={ouvrirDepart}
                  className="btn-primary w-full"
                  disabled={Boolean(action)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Valider le départ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErreurAction('')
                    setModalAnnuler(true)
                  }}
                  className="btn w-full border border-accent-100 bg-white text-accent-600 hover:bg-accent-50"
                  disabled={Boolean(action)}
                >
                  Annuler le départ
                </button>
              </>
            ) : (
              <Link
                to="/admin/scan"
                className="btn-secondary w-full"
              >
                <ScanLine className="h-4 w-4" />
                Scanner les billets
              </Link>
            )}
          </div>
        </div>
      </article>

      <Modal
        open={modalDepart}
        onClose={() => (action ? null : setModalDepart(false))}
        title={pret ? 'Valider le départ' : 'Départ anticipé'}
        description={
          pret
            ? 'Le véhicule peut partir. Le tableau public sera mis à jour immédiatement.'
            : 'Le seuil recommandé pour cette gare n’est pas encore atteint.'
        }
        size="sm"
      >
        <div className="space-y-4">
          {!pret && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-extrabold text-amber-900">
                    Remplissage à {taux} %
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    Le seuil recommandé pour {nomGare(vehicule.gare?.nom)} est de{' '}
                    {vehicule.seuil_remplissage} %. Il manque encore{' '}
                    {placesManquantes} {pluraliser('place', placesManquantes)}.
                    Vous pouvez tout de même déclencher le départ.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-display text-lg font-bold text-primary-900">
              {vehicule.destination}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {vehicule.chauffeur} · {vehicule.matricule}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>{occupation} passagers à bord</span>
              <span>{taux} % de remplissage</span>
            </div>
          </div>

          {erreurAction && (
            <p className="rounded-xl bg-accent-50 px-4 py-3 text-xs font-semibold text-accent-700">
              {erreurAction}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalDepart(false)}
              disabled={Boolean(action)}
            >
              Retour
            </button>
            <button
              type="button"
              className={pret ? 'btn-primary' : 'btn-accent'}
              onClick={confirmerDepart}
              disabled={Boolean(action)}
            >
              {action === 'depart' ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Validation…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {pret ? 'Confirmer le départ' : 'Partir quand même'}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modalAnnuler}
        onClose={() => (action ? null : setModalAnnuler(false))}
        title="Annuler le départ"
        description="Les réservations en ligne associées seront invalidées."
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-accent-50 px-4 py-3 text-xs leading-relaxed text-accent-700">
            Cette action est définitive. Les billets déjà générés ne pourront
            plus être scannés.
          </div>
          <div>
            <label htmlFor="motif-annulation" className="label">
              Motif (facultatif)
            </label>
            <textarea
              id="motif-annulation"
              className="input min-h-24 resize-none"
              placeholder="Ex. panne moteur, conditions météo…"
              value={motif}
              onChange={(event) => setMotif(event.target.value)}
              maxLength={250}
            />
          </div>
          {erreurAction && (
            <p className="rounded-xl bg-accent-50 px-4 py-3 text-xs font-semibold text-accent-700">
              {erreurAction}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalAnnuler(false)}
              disabled={Boolean(action)}
            >
              Retour
            </button>
            <button
              type="button"
              className="btn-accent"
              onClick={confirmerAnnulation}
              disabled={Boolean(action)}
            >
              {action === 'annuler' ? (
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
    </>
  )
}

export default function AdminDashboardPage() {
  const { utilisateur } = useAuth()
  const [date, setDate] = useState(dateDuJour())
  const [vehicules, setVehicules] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState('en_attente')
  const [derniereMaj, setDerniereMaj] = useState(null)
  const [notification, setNotification] = useState(null)
  const [stats, setStats] = useState(null)

  const chargerVehicules = useCallback(
    async ({ silencieux = false } = {}) => {
      if (!silencieux) setChargement(true)
      try {
        const donnees = await api.getAdminVehicles({ date })
        setVehicules(donnees)
        setDerniereMaj(new Date())
        setErreur('')
      } catch (error) {
        setErreur(getErrorMessage(error))
      } finally {
        if (!silencieux) setChargement(false)
      }
    },
    [date],
  )

  useEffect(() => {
    chargerVehicules()
    const polling = window.setInterval(
      () => chargerVehicules({ silencieux: true }),
      30000,
    )
    return () => window.clearInterval(polling)
  }, [chargerVehicules])

  useEffect(() => {
    let actif = true
    const chargerStats = () => {
      api
        .getAdminStats()
        .then((donnees) => {
          if (actif) setStats(donnees)
        })
        .catch(() => {})
    }
    chargerStats()
    const polling = window.setInterval(chargerStats, 60000)
    return () => {
      actif = false
      window.clearInterval(polling)
    }
  }, [])

  useEffect(() => {
    if (!notification) return undefined
    const timer = window.setTimeout(() => setNotification(null), 4500)
    return () => window.clearTimeout(timer)
  }, [notification])

  function notifier(type, message) {
    setNotification({ type, message })
  }

  const statistiques = useMemo(() => {
    const enAttente = vehicules.filter((v) => v.statut === 'en_attente')
    const partis = vehicules.filter((v) => v.statut === 'parti')
    const annules = vehicules.filter((v) => v.statut === 'annule')
    const reservations = vehicules
      .filter((v) => v.statut !== 'annule')
      .reduce((total, v) => total + v.places_reservees, 0)
    const moyenne = enAttente.length
      ? Math.round(
          enAttente.reduce((total, v) => total + v.taux_remplissage, 0) /
            enAttente.length,
        )
      : 0
    return { enAttente, partis, annules, reservations, moyenne }
  }, [vehicules])

  const compteurParFiltre = {
    en_attente: statistiques.enAttente.length,
    parti: statistiques.partis.length,
    annule: statistiques.annules.length,
    tous: vehicules.length,
  }

  const vehiculesAffiches =
    filtre === 'tous'
      ? vehicules
      : vehicules.filter((vehicule) => vehicule.statut === filtre)

  const cartes = [
    {
      label: 'En attente',
      valeur: statistiques.enAttente.length,
      detail: 'départs à surveiller',
      icone: Clock,
      couleur: 'bg-sun-100 text-[#82650d]',
    },
    {
      label: 'Départs validés',
      valeur: statistiques.partis.length,
      detail: date === dateDuJour() ? 'aujourd’hui' : formatDateJour(date),
      icone: CheckCircle2,
      couleur: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Réservations en ligne',
      valeur: statistiques.reservations,
      detail: 'places réservées',
      icone: Users,
      couleur: 'bg-primary-50 text-primary-700',
    },
    {
      label: 'Remplissage moyen',
      valeur: `${statistiques.moyenne} %`,
      detail: 'des départs en attente',
      icone: RefreshCw,
      couleur: 'bg-accent-50 text-accent-600',
    },
  ]

  const prenom = utilisateur?.nom?.split(' ')[0] || 'Responsable'

  return (
    <div className="mx-auto max-w-7xl">
      {notification && (
        <div
          className={`fixed right-4 top-20 z-[60] flex max-w-sm items-start gap-2 rounded-xl border px-4 py-3 text-xs font-semibold shadow-card animate-fade-up ${
            notification.type === 'succes'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-accent-100 bg-accent-50 text-accent-700'
          }`}
          role="status"
        >
          {notification.type === 'succes' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {notification.message}
        </div>
      )}

      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <span className="eyebrow">
            <span className="h-2 w-2 animate-soft-pulse rounded-full bg-emerald-500" />
            Le check des départs
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl">
            Bonjour, {prenom}.
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {utilisateur?.gare ? nomGare(utilisateur.gare.nom) : 'Votre gare'} ·{' '}
            {formatDateLongue(date)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <Clock className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value || dateDuJour())}
              className="bg-transparent text-xs font-bold text-primary-900 outline-none"
              aria-label="Date du tableau de bord"
            />
            {date !== dateDuJour() && (
              <button
                type="button"
                onClick={() => setDate(dateDuJour())}
                className="ml-1 text-[10px] font-bold text-accent-500"
              >
                Aujourd’hui
              </button>
            )}
          </div>
          <button
            type="button"
            className="btn-secondary px-4 py-2.5"
            onClick={() => chargerVehicules()}
            disabled={chargement}
          >
            <RefreshCw className={`h-4 w-4 ${chargement ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <Link to="/admin/vehicules?nouveau=1" className="btn-primary px-4 py-2.5">
            <Plus className="h-4 w-4" />
            Ajouter un véhicule
          </Link>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cartes.map((carte) => (
          <div key={carte.label} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                  {carte.label}
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-primary-900">
                  {carte.valeur}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  {carte.detail}
                </p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${carte.couleur}`}>
                <carte.icone className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                Cette semaine
              </p>
              <h2 className="mt-1 font-display text-lg font-bold text-primary-900">
                Taux de remplissage moyen
              </h2>
            </div>
            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[9px] font-bold text-primary-700">
              7 jours
            </span>
          </div>
          <div className="mt-4 h-56 w-full">
            {stats?.remplissage_semaine?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.remplissage_semaine}
                  margin={{ top: 6, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="remplissage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3e75a7" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#3e75a7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eef7" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip
                    formatter={(valeur) => [`${valeur} %`, 'Remplissage']}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e6eef7',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#06172b',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="taux"
                    stroke="#245886"
                    strokeWidth={2.5}
                    fill="url(#remplissage)"
                    dot={{ r: 3, fill: '#245886', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Aucune donnée de remplissage pour les 7 prochains jours.
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                Sur la semaine
              </p>
              <h2 className="mt-1 font-display text-lg font-bold text-primary-900">
                Destinations les plus populaires
              </h2>
            </div>
            <span className="rounded-full bg-sun-100 px-2.5 py-1 text-[9px] font-bold text-[#82650d]">
              Passagers
            </span>
          </div>
          <div className="mt-4 h-56 w-full">
            {stats?.destinations_populaires?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.destinations_populaires}
                  margin={{ top: 6, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eef7" vertical={false} />
                  <XAxis
                    dataKey="destination"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(valeur) => [`${valeur} passagers`, 'Réservés']}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e6eef7',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#06172b',
                    }}
                  />
                  <Bar dataKey="passagers" radius={[6, 6, 0, 0]}>
                    {stats.destinations_populaires.map((item, index) => (
                      <Cell
                        key={item.destination}
                        fill={index === 0 ? '#f2c94c' : '#245886'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Aucune réservation sur les 7 prochains jours.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-sun-500/30 bg-sun-50/60 px-5 py-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="flex items-start gap-2.5 text-xs leading-relaxed text-[#735b12]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sun-600" />
            <span>
              Seuil recommandé pour votre gare :{' '}
              <strong>{utilisateur?.gare?.seuil_remplissage} %</strong>. Le
              responsable reste libre de valider un départ anticipé.
            </span>
          </p>
          <span className="shrink-0 text-[10px] font-semibold text-[#735b12]">
            {derniereMaj
              ? `Actualisé à ${derniereMaj.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })} · toutes les 30 s`
              : 'Synchronisation…'}
          </span>
        </div>
      </div>

      <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="inline-flex w-full flex-wrap rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto">
          {FILTRES.map((item) => (
            <button
              key={item.cle}
              type="button"
              onClick={() => setFiltre(item.cle)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                filtre === item.cle
                  ? 'bg-primary-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-primary-800'
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                  filtre === item.cle ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {compteurParFiltre[item.cle]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-slate-400">
          {vehiculesAffiches.length} véhicule
          {vehiculesAffiches.length > 1 ? 's' : ''} affiché
          {vehiculesAffiches.length > 1 ? 's' : ''}
        </p>
      </div>

      {erreur && (
        <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold text-accent-700">{erreur}</p>
          <button
            type="button"
            onClick={() => chargerVehicules()}
            className="text-xs font-extrabold text-accent-700 underline underline-offset-2"
          >
            Réessayer
          </button>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {chargement ? (
          [0, 1].map((item) => (
            <div
              key={item}
              className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400"
            >
              <Spinner className="h-6 w-6" />
            </div>
          ))
        ) : vehiculesAffiches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />
            <h3 className="mt-4 font-display text-lg font-bold text-primary-900">
              Aucun départ dans cette catégorie
            </h3>
            <p className="mt-1.5 text-sm text-slate-500">
              Changez de filtre ou ajoutez un nouveau véhicule pour cette date.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setFiltre('tous')}
                className="btn-secondary"
              >
                Voir tous les départs
              </button>
              <Link to="/admin/vehicules?nouveau=1" className="btn-primary">
                <Plus className="h-4 w-4" />
                Ajouter un véhicule
              </Link>
            </div>
          </div>
        ) : (
          vehiculesAffiches.map((vehicule) => (
            <CarteVehiculeAdmin
              key={vehicule.id}
              vehicule={vehicule}
              onRefresh={() => chargerVehicules({ silencieux: true })}
              onNotify={notifier}
            />
          ))
        )}
      </div>
    </div>
  )
}
