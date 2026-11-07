import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bus,
  CheckCircle2,
  Clock,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { Spinner } from '../components/Loading'
import { useAuth } from '../context/AuthContext'
import {
  dateDuJour,
  formatDateCourte,
  getErrorMessage,
  nomGare,
  pluraliser,
} from '../utils/format'

const FORM_VIDE = {
  matricule: '',
  destination: '',
  chauffeur: '',
  capacite: '18',
  date_depart: dateDuJour(),
  heure_depart: '08:00',
  prix: '3000',
  duree_minutes: '60',
}

function ModalVehicule({
  open,
  vehicule,
  gare,
  destinations,
  onClose,
  onSaved,
}) {
  const [formulaire, setFormulaire] = useState(FORM_VIDE)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const edition = Boolean(vehicule)

  useEffect(() => {
    if (!open) return
    setErreur('')
    if (vehicule) {
      setFormulaire({
        matricule: vehicule.matricule,
        destination: vehicule.destination,
        chauffeur: vehicule.chauffeur,
        capacite: String(vehicule.capacite),
        date_depart: vehicule.date_depart,
        heure_depart: vehicule.heure_depart_24h || '08:00',
        prix: String(vehicule.prix),
        duree_minutes: String(vehicule.duree_minutes),
      })
    } else {
      setFormulaire({ ...FORM_VIDE, date_depart: dateDuJour() })
    }
  }, [open, vehicule])

  function modifier(champ, valeur) {
    setFormulaire((courant) => ({ ...courant, [champ]: valeur }))
  }

  async function soumettre(event) {
    event.preventDefault()
    setErreur('')

    const capacite = Number(formulaire.capacite)
    const prix = Number(formulaire.prix)
    const duree = Number(formulaire.duree_minutes)
    if (!formulaire.matricule.trim() || !formulaire.destination.trim() || !formulaire.chauffeur.trim()) {
      setErreur('Renseignez le matricule, la destination et le chauffeur.')
      return
    }
    if (!Number.isInteger(capacite) || capacite < 4 || capacite > 100) {
      setErreur('La capacité doit être un nombre entier compris entre 4 et 100.')
      return
    }
    if (!Number.isFinite(prix) || prix < 0) {
      setErreur('Indiquez un prix valide.')
      return
    }
    if (!Number.isInteger(duree) || duree < 5) {
      setErreur('La durée doit être exprimée en minutes (minimum 5).')
      return
    }

    const payload = {
      matricule: formulaire.matricule.trim(),
      destination: formulaire.destination.trim(),
      chauffeur: formulaire.chauffeur.trim(),
      capacite,
      date_depart: formulaire.date_depart,
      heure_depart: formulaire.heure_depart,
      prix,
      duree_minutes: duree,
    }

    setEnvoi(true)
    try {
      if (edition) {
        await api.updateVehicle(vehicule.id, payload)
        onSaved('Véhicule modifié avec succès.')
      } else {
        await api.createVehicle(payload)
        onSaved('Nouveau véhicule ajouté à la gare.')
      }
    } catch (error) {
      setErreur(getErrorMessage(error))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => (envoi ? null : onClose())}
      title={edition ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
      description={
        edition
          ? 'Les modifications sont possibles tant que le départ est en attente.'
          : 'Créez un nouveau départ programmé pour votre gare.'
      }
      size="lg"
    >
      <form onSubmit={soumettre} className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm">
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-primary-400">
              Gare de rattachement
            </p>
            <p className="text-sm font-bold text-primary-900">{nomGare(gare?.nom)}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-matricule" className="label">
              Immatriculation
            </label>
            <input
              id="f-matricule"
              className="input"
              placeholder="Ex. 1234 TBA"
              value={formulaire.matricule}
              onChange={(event) => modifier('matricule', event.target.value)}
              maxLength={40}
              required
            />
          </div>
          <div>
            <label htmlFor="f-capacite" className="label">
              Capacité totale
            </label>
            <input
              id="f-capacite"
              type="number"
              min="4"
              max="100"
              className="input"
              value={formulaire.capacite}
              onChange={(event) => modifier('capacite', event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="f-destination" className="label">
              Destination
            </label>
            <input
              id="f-destination"
              className="input"
              list="destinations-gare"
              placeholder="Ex. Betafo"
              value={formulaire.destination}
              onChange={(event) => modifier('destination', event.target.value)}
              maxLength={120}
              required
            />
            <datalist id="destinations-gare">
              {destinations.map((item) => (
                <option key={item.nom} value={item.nom} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="f-chauffeur" className="label">
              Chauffeur
            </label>
            <input
              id="f-chauffeur"
              className="input"
              placeholder="Nom du chauffeur"
              value={formulaire.chauffeur}
              onChange={(event) => modifier('chauffeur', event.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div>
            <label htmlFor="f-date" className="label">
              Date de départ
            </label>
            <input
              id="f-date"
              type="date"
              className="input"
              value={formulaire.date_depart}
              onChange={(event) => modifier('date_depart', event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="f-heure" className="label">
              Heure prévisionnelle
            </label>
            <input
              id="f-heure"
              type="time"
              className="input"
              value={formulaire.heure_depart}
              onChange={(event) => modifier('heure_depart', event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="f-prix" className="label">
              Prix par place (Ar)
            </label>
            <input
              id="f-prix"
              type="number"
              min="0"
              step="100"
              className="input"
              value={formulaire.prix}
              onChange={(event) => modifier('prix', event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="f-duree" className="label">
              Durée estimée (minutes)
            </label>
            <input
              id="f-duree"
              type="number"
              min="5"
              step="5"
              className="input"
              value={formulaire.duree_minutes}
              onChange={(event) => modifier('duree_minutes', event.target.value)}
              required
            />
          </div>
        </div>

        {erreur && (
          <div
            role="alert"
            className="rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 text-xs font-semibold text-accent-700"
          >
            {erreur}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={envoi}
          >
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={envoi}>
            {envoi ? (
              <>
                <Spinner className="h-4 w-4" />
                Enregistrement…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {edition ? 'Enregistrer les modifications' : 'Ajouter le véhicule'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminVehiclesPage() {
  const { utilisateur } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [vehicules, setVehicules] = useState([])
  const [destinations, setDestinations] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [modalOuverte, setModalOuverte] = useState(false)
  const [vehiculeEdition, setVehiculeEdition] = useState(null)
  const [vehiculeSuppression, setVehiculeSuppression] = useState(null)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)
  const [erreurSuppression, setErreurSuppression] = useState('')
  const [notification, setNotification] = useState('')

  async function chargerVehicules() {
    setChargement(true)
    try {
      const donnees = await api.getAdminVehicles()
      setVehicules(donnees)
      setErreur('')
    } catch (error) {
      setErreur(getErrorMessage(error))
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    let actif = true
    setChargement(true)
    Promise.all([
      api.getAdminVehicles(),
      utilisateur?.gare_id
        ? api.getDestinations(utilisateur.gare_id).catch(() => [])
        : Promise.resolve([]),
    ])
      .then(([liste, listeDestinations]) => {
        if (!actif) return
        setVehicules(liste)
        setDestinations(listeDestinations)
        setErreur('')
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
  }, [utilisateur?.gare_id])

  useEffect(() => {
    if (searchParams.get('nouveau') === '1') {
      setVehiculeEdition(null)
      setModalOuverte(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!notification) return undefined
    const timer = window.setTimeout(() => setNotification(''), 4000)
    return () => window.clearTimeout(timer)
  }, [notification])

  function ouvrirAjout() {
    setVehiculeEdition(null)
    setModalOuverte(true)
  }

  function ouvrirEdition(vehicule) {
    setVehiculeEdition(vehicule)
    setModalOuverte(true)
  }

  function fermerModal() {
    setModalOuverte(false)
    setVehiculeEdition(null)
    if (searchParams.get('nouveau') === '1') {
      navigate('/admin/vehicules', { replace: true })
    }
  }

  async function apresSauvegarde(message) {
    fermerModal()
    setNotification(message)
    await chargerVehicules()
  }

  async function confirmerSuppression() {
    if (!vehiculeSuppression) return
    setSuppressionEnCours(true)
    setErreurSuppression('')
    try {
      await api.deleteVehicle(vehiculeSuppression.id)
      setVehiculeSuppression(null)
      setNotification('Véhicule retiré de la liste.')
      await chargerVehicules()
    } catch (error) {
      setErreurSuppression(getErrorMessage(error))
    } finally {
      setSuppressionEnCours(false)
    }
  }

  const vehiculesFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    return vehicules.filter((vehicule) => {
      const correspondTexte =
        !terme ||
        [vehicule.matricule, vehicule.destination, vehicule.chauffeur]
          .join(' ')
          .toLowerCase()
          .includes(terme)
      const correspondStatut =
        filtreStatut === 'tous' || vehicule.statut === filtreStatut
      return correspondTexte && correspondStatut
    })
  }, [vehicules, recherche, filtreStatut])

  return (
    <div className="mx-auto max-w-7xl">
      {notification && (
        <div className="fixed right-4 top-20 z-[60] flex max-w-sm items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-card animate-fade-up">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {notification}
        </div>
      )}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <span className="eyebrow">Parc de la gare</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl">
            Gestion des véhicules
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Ajoutez, modifiez ou retirez les départs programmés de{' '}
            {nomGare(utilisateur?.gare?.nom)}. Les véhicules déjà partis restent
            archivés.
          </p>
        </div>
        <button type="button" onClick={ouvrirAjout} className="btn-primary self-start">
          <Plus className="h-4 w-4" />
          Ajouter un véhicule
        </button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <Bus className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold text-primary-900">
              {vehicules.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Véhicules programmés
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sun-100 text-[#82650d]">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold text-primary-900">
              {vehicules.filter((v) => v.statut === 'en_attente').length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              En attente
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold text-primary-900">
              {destinations.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Destinations desservies
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="field-icon" />
          <input
            type="search"
            className="input border-0 py-2.5 pl-11 shadow-none focus:ring-0"
            placeholder="Rechercher une destination, un chauffeur, un matricule…"
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            aria-label="Rechercher un véhicule"
          />
        </div>
        <select
          className="input w-full border-0 py-2.5 shadow-none focus:ring-0 sm:w-48"
          value={filtreStatut}
          onChange={(event) => setFiltreStatut(event.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="tous">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="parti">Partis</option>
          <option value="annule">Annulés</option>
        </select>
        <button
          type="button"
          onClick={chargerVehicules}
          className="btn-secondary shrink-0 px-4 py-2.5"
          disabled={chargement}
        >
          <RefreshCw className={`h-4 w-4 ${chargement ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {erreur && (
        <div className="mt-4 flex flex-col justify-between gap-2 rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold text-accent-700">{erreur}</p>
          <button
            type="button"
            onClick={chargerVehicules}
            className="text-xs font-extrabold text-accent-700 underline underline-offset-2"
          >
            Réessayer
          </button>
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400 md:grid">
          <div className="col-span-2">Départ</div>
          <div className="col-span-3">Destination</div>
          <div className="col-span-2">Chauffeur</div>
          <div className="col-span-1">Places</div>
          <div className="col-span-2">Statut</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {chargement ? (
          <div className="flex min-h-72 items-center justify-center text-slate-400">
            <Spinner className="h-6 w-6" />
          </div>
        ) : vehiculesFiltres.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <Bus className="mx-auto h-9 w-9 text-slate-300" />
            <h3 className="mt-4 font-display text-lg font-bold text-primary-900">
              Aucun véhicule trouvé
            </h3>
            <p className="mt-1.5 text-sm text-slate-500">
              Modifiez vos filtres ou ajoutez un nouveau départ.
            </p>
            <button type="button" onClick={ouvrirAjout} className="btn-primary mt-5">
              <Plus className="h-4 w-4" />
              Ajouter un véhicule
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {vehiculesFiltres.map((vehicule) => (
              <div
                key={vehicule.id}
                className="grid grid-cols-1 gap-4 px-5 py-4 transition hover:bg-slate-50/60 md:grid-cols-12 md:items-center md:gap-3"
              >
                <div className="flex items-center justify-between md:col-span-2 md:block">
                  <p className="font-display text-base font-extrabold text-primary-900">
                    {vehicule.heure_depart}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400">
                    {formatDateCourte(vehicule.date_depart)}
                  </p>
                </div>

                <div className="md:col-span-3">
                  <p className="font-display text-sm font-bold text-primary-900">
                    {vehicule.destination}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] font-semibold text-slate-400">
                    {vehicule.matricule}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-slate-600">{vehicule.chauffeur}</p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 md:col-span-1">
                  <Users className="h-3.5 w-3.5 text-slate-400 md:hidden" />
                  {vehicule.capacite}
                  <span className="md:hidden">places</span>
                </div>

                <div className="md:col-span-2">
                  <StatusBadge statut={vehicule.statut} />
                </div>

                <div className="flex items-center gap-2 md:col-span-2 md:justify-end">
                  {vehicule.statut === 'en_attente' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => ouvrirEdition(vehicule)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800"
                        title="Modifier"
                        aria-label={`Modifier le véhicule ${vehicule.matricule}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setErreurSuppression('')
                          setVehiculeSuppression(vehicule)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-accent-200 hover:bg-accent-50 hover:text-accent-600"
                        title="Retirer"
                        aria-label={`Retirer le véhicule ${vehicule.matricule}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-300">Archivé</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-[10px] text-slate-400">
        {vehiculesFiltres.length} résultat
        {vehiculesFiltres.length > 1 ? 's' : ''}. Les véhicules en attente peuvent
        être modifiés ou retirés ; les départs partis ou annulés sont conservés
        pour l’historique.
      </p>

      <ModalVehicule
        open={modalOuverte}
        vehicule={vehiculeEdition}
        gare={utilisateur?.gare}
        destinations={destinations}
        onClose={fermerModal}
        onSaved={apresSauvegarde}
      />

      <Modal
        open={Boolean(vehiculeSuppression)}
        onClose={() => (suppressionEnCours ? null : setVehiculeSuppression(null))}
        title="Retirer ce véhicule ?"
        description="Cette action supprime le départ et toutes ses réservations."
        size="sm"
      >
        {vehiculeSuppression && (
          <div className="space-y-4">
            <div className="rounded-xl border border-accent-100 bg-accent-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
                <div>
                  <p className="text-sm font-bold text-accent-800">
                    {vehiculeSuppression.destination} · {vehiculeSuppression.heure_depart}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-accent-700">
                    {vehiculeSuppression.places_reservees > 0
                      ? `${vehiculeSuppression.places_reservees} ${pluraliser(
                          'place',
                          vehiculeSuppression.places_reservees,
                        )} réservée${
                          vehiculeSuppression.places_reservees > 1 ? 's' : ''
                        } seront supprimées. Les billets correspondants ne seront plus valables.`
                      : 'Aucune réservation en ligne n’est associée à ce départ.'}
                  </p>
                </div>
              </div>
            </div>

            {erreurSuppression && (
              <p className="rounded-xl bg-accent-50 px-4 py-3 text-xs font-semibold text-accent-700">
                {erreurSuppression}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setVehiculeSuppression(null)}
                disabled={suppressionEnCours}
              >
                Conserver
              </button>
              <button
                type="button"
                className="btn-accent"
                onClick={confirmerSuppression}
                disabled={suppressionEnCours}
              >
                {suppressionEnCours ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Suppression…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Retirer le véhicule
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
