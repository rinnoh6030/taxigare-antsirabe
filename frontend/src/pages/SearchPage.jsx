import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Route,
  Users,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import EmptyState from '../components/EmptyState'
import OccupancyBar from '../components/OccupancyBar'
import SearchForm from '../components/SearchForm'
import { Spinner } from '../components/Loading'
import {
  dateDuJour,
  formatDateLongue,
  formatDuration,
  formatPrice,
  getErrorMessage,
  nomGare,
} from '../utils/format'

function CarteResultat({ vehicule, index }) {
  const complet = vehicule.places_restantes <= 0
  return (
    <article
      className="group animate-fade-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition hover:border-primary-200 hover:shadow-card"
      style={{ animationDelay: `${Math.min(index * 60, 240)}ms` }}
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-7">
        <div className="flex shrink-0 items-center gap-4 lg:w-44 lg:flex-col lg:items-start lg:gap-2 lg:border-r lg:border-slate-100 lg:pr-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sun-100 text-primary-800 lg:hidden">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
              Créneau prévu
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-primary-900">
              {vehicule.heure_depart}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {vehicule.creneau}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-primary-50 text-primary-700">
              <MapPin className="h-3 w-3" />
              {nomGare(vehicule.gare?.nom)}
            </span>
            <span className="badge bg-slate-100 text-slate-500">
              {formatDuration(vehicule.duree_minutes)}
            </span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-primary-900">
            {vehicule.destination}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Route className="h-3.5 w-3.5 text-slate-400" />
              {vehicule.matricule}
            </span>
            <span>{vehicule.chauffeur}</span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              {vehicule.places_restantes} place
              {vehicule.places_restantes > 1 ? 's' : ''} restante
              {vehicule.places_restantes > 1 ? 's' : ''}
            </span>
          </div>

          <div className="mt-4 max-w-md">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Remplissage estimé</span>
              <span>
                {vehicule.occupation}/{vehicule.capacite} · {vehicule.taux_remplissage} %
              </span>
            </div>
            <OccupancyBar
              valeur={vehicule.taux_remplissage}
              capacite={vehicule.capacite}
              seuil={vehicule.seuil_remplissage}
            />
            <p className="mt-1.5 text-[10px] font-medium text-slate-400">
              Seuil recommandé pour cette gare : {vehicule.seuil_remplissage} %
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-end justify-between gap-5 border-t border-slate-100 pt-4 lg:w-44 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="text-left lg:text-right">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
              Prix / place
            </p>
            <p className="mt-1 font-display text-xl font-extrabold text-accent-500">
              {formatPrice(vehicule.prix)}
            </p>
          </div>
          {complet ? (
            <span className="badge bg-slate-100 text-slate-500">Complet</span>
          ) : (
            <Link
              to={`/reserver/${vehicule.id}`}
              className="btn-primary w-full whitespace-nowrap px-4 py-2.5 lg:w-auto"
            >
              Réserver
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const gareId = searchParams.get('gare') || ''
  const destination = searchParams.get('destination') || ''
  const date = searchParams.get('date') || dateDuJour()

  const [vehicules, setVehicules] = useState([])
  const [gare, setGare] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    setChargement(true)
    setErreur('')

    Promise.all([
      api.searchVehicles({
        gareId,
        destination,
        date,
      }),
      gareId ? api.getGares() : Promise.resolve([]),
    ])
      .then(([resultats, gares]) => {
        if (!actif) return
        setVehicules(resultats)
        setGare(gares.find((item) => String(item.id) === String(gareId)) || null)
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
  }, [gareId, destination, date])

  function relancerRecherche(criteres) {
    const params = new URLSearchParams({
      gare: String(criteres.gareId),
      date: criteres.date,
    })
    if (criteres.destination) params.set('destination', criteres.destination)
    navigate(`/recherche?${params.toString()}`)
  }

  const titre = destination
    ? `Départs vers ${destination}`
    : 'Tous les départs disponibles'

  return (
    <div className="bg-paper">
      <section className="border-b border-slate-100 bg-white">
        <div className="container-page py-8 sm:py-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-primary-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à l’accueil
          </Link>
          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="eyebrow">Résultats de recherche</span>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl">
                {titre}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent-500" />
                  {gare ? nomGare(gare.nom) : 'Gare sélectionnée'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent-500" />
                  {formatDateLongue(date)}
                </span>
              </div>
            </div>
            {!chargement && !erreur && (
              <div className="rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-bold text-primary-800">
                {vehicules.length} départ{vehicules.length > 1 ? 's' : ''} trouvé
                {vehicules.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-8 lg:py-10">
        <SearchForm
          initial={{ gare: gareId, destination, date }}
          onSearch={relancerRecherche}
          submitLabel="Actualiser"
        />

        {gare && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-sun-500/30 bg-sun-50/60 px-4 py-3.5 text-xs leading-relaxed text-[#7a5f11]">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sun-600" />
            <p>
              À {nomGare(gare.nom)}, les véhicules partent à partir de{' '}
              <strong>{gare.seuil_remplissage} % de remplissage</strong>. Les
              horaires sont prévisionnels&nbsp;: le départ effectif est validé
              par le responsable.
            </p>
          </div>
        )}

        <div className="mt-7 space-y-4">
          {chargement &&
            [0, 1, 2].map((item) => (
              <div
                key={item}
                className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400"
              >
                <Spinner className="h-6 w-6" />
              </div>
            ))}

          {!chargement && erreur && (
            <div className="rounded-2xl border border-accent-100 bg-accent-50 p-6 text-sm font-semibold text-accent-700">
              {erreur}
            </div>
          )}

          {!chargement && !erreur && vehicules.length === 0 && (
            <EmptyState
              icon={Route}
              title="Aucun départ trouvé"
              description="Aucun véhicule ne correspond à ces critères. Essayez une autre destination, une autre date ou consultez toutes les destinations de la gare."
              action={
                <Link
                  to={`/recherche?gare=${gareId}&date=${date}`}
                  className="btn-primary"
                >
                  Voir toutes les destinations
                </Link>
              }
            />
          )}

          {!chargement &&
            !erreur &&
            vehicules.map((vehicule, index) => (
              <CarteResultat
                key={vehicule.id}
                vehicule={vehicule}
                index={index}
              />
            ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/departs"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 transition hover:text-accent-500"
          >
            Consulter le tableau des départs en direct
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
