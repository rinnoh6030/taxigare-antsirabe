import { useEffect, useId, useState } from 'react'
import {
  Building2,
  Calendar,
  ChevronDown,
  Info,
  MapPin,
  Search,
} from 'lucide-react'
import { api } from '../api/client'
import { cn, dateDuJour, getErrorMessage } from '../utils/format'

export default function SearchForm({
  initial = {},
  onSearch,
  variant = 'card',
  submitLabel = 'Rechercher',
}) {
  const id = useId()
  const [gares, setGares] = useState([])
  const [destinations, setDestinations] = useState([])
  const [cooperatives, setCooperatives] = useState([])
  const [gareId, setGareId] = useState(
    initial.gareId ? String(initial.gareId) : initial.gare ? String(initial.gare) : '',
  )
  const [destination, setDestination] = useState(initial.destination || '')
  const [cooperativeId, setCooperativeId] = useState(
    initial.cooperativeId
      ? String(initial.cooperativeId)
      : initial.cooperative
        ? String(initial.cooperative)
        : '',
  )
  const [date, setDate] = useState(initial.date || dateDuJour())
  const [chargementGares, setChargementGares] = useState(true)
  const [chargementDestinations, setChargementDestinations] = useState(false)
  const [chargementCooperatives, setChargementCooperatives] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    setGareId(
      initial.gareId ? String(initial.gareId) : initial.gare ? String(initial.gare) : '',
    )
    setDestination(initial.destination || '')
    setCooperativeId(
      initial.cooperativeId
        ? String(initial.cooperativeId)
        : initial.cooperative
          ? String(initial.cooperative)
          : '',
    )
    setDate(initial.date || dateDuJour())
  }, [
    initial.gareId,
    initial.gare,
    initial.destination,
    initial.cooperativeId,
    initial.cooperative,
    initial.date,
  ])

  useEffect(() => {
    let actif = true
    setChargementGares(true)
    api
      .getGares()
      .then((donnees) => {
        if (!actif) return
        setGares(donnees)
        setGareId((courant) => courant || (donnees[0] ? String(donnees[0].id) : ''))
        setErreur('')
      })
      .catch((error) => {
        if (actif) setErreur(getErrorMessage(error))
      })
      .finally(() => {
        if (actif) setChargementGares(false)
      })
    return () => {
      actif = false
    }
  }, [])

  useEffect(() => {
    if (!gareId) {
      setDestinations([])
      return undefined
    }
    let actif = true
    setChargementDestinations(true)
    api
      .getDestinations(gareId)
      .then((donnees) => {
        if (actif) setDestinations(donnees)
      })
      .catch((error) => {
        if (actif) setErreur(getErrorMessage(error))
      })
      .finally(() => {
        if (actif) setChargementDestinations(false)
      })
    return () => {
      actif = false
    }
  }, [gareId])

  useEffect(() => {
    if (!gareId) {
      setCooperatives([])
      return undefined
    }
    let actif = true
    setChargementCooperatives(true)
    api
      .getCooperatives(gareId)
      .then((donnees) => {
        if (!actif) return
        setCooperatives(donnees)
        setCooperativeId((courant) =>
          donnees.some((item) => String(item.id) === courant) ? courant : '',
        )
      })
      .catch(() => {
        if (actif) setCooperatives([])
      })
      .finally(() => {
        if (actif) setChargementCooperatives(false)
      })
    return () => {
      actif = false
    }
  }, [gareId])

  const afficherCooperatives = cooperatives.length > 1

  function soumettre(event) {
    event.preventDefault()
    if (!gareId) return
    onSearch({
      gareId: Number(gareId),
      destination,
      cooperativeId: cooperativeId ? Number(cooperativeId) : '',
      date,
    })
  }

  return (
    <form
      onSubmit={soumettre}
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white',
        variant === 'hero' ? 'p-4 shadow-card sm:p-5' : 'p-4 shadow-soft sm:p-5',
      )}
    >
      <div
        className={cn(
          'grid gap-3 lg:items-end',
          afficherCooperatives
            ? 'lg:grid-cols-[0.95fr_1fr_1.15fr_0.85fr_auto]'
            : 'lg:grid-cols-[1fr_1.15fr_0.92fr_auto]',
        )}
      >
        <div>
          <label htmlFor={`${id}-gare`} className="label">
            Gare de départ
          </label>
          <div className="relative">
            <MapPin className="field-icon" />
            <select
              id={`${id}-gare`}
              className="input appearance-none pl-11 pr-10"
              value={gareId}
              onChange={(event) => {
                setGareId(event.target.value)
                setDestination('')
                setCooperativeId('')
              }}
              disabled={chargementGares}
              required
            >
              {gares.length === 0 && <option value="">Chargement…</option>}
              {gares.map((gare) => (
                <option key={gare.id} value={gare.id}>
                  Gare {gare.nom === 'Asabotsy' ? 'd’' : 'de '}
                  {gare.nom}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {afficherCooperatives && (
          <div>
            <label htmlFor={`${id}-cooperative`} className="label">
              Coopérative
            </label>
            <div className="relative">
              <Building2 className="field-icon" />
              <select
                id={`${id}-cooperative`}
                className="input appearance-none pl-11 pr-10"
                value={cooperativeId}
                onChange={(event) => setCooperativeId(event.target.value)}
                disabled={chargementCooperatives}
              >
                <option value="">Toutes les coopératives</option>
                {cooperatives.map((cooperative) => (
                  <option key={cooperative.id} value={cooperative.id}>
                    {cooperative.nom}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        )}

        <div>
          <label htmlFor={`${id}-destination`} className="label">
            Destination
          </label>
          <div className="relative">
            <MapPin className="field-icon" />
            <select
              id={`${id}-destination`}
              className="input appearance-none pl-11 pr-10"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              disabled={chargementDestinations || !gareId}
            >
              <option value="">Toutes les destinations</option>
              {destinations.map((item) => (
                <option key={item.nom} value={item.nom}>
                  {item.nom}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div>
          <label htmlFor={`${id}-date`} className="label">
            Date de voyage
          </label>
          <div className="relative">
            <Calendar className="field-icon" />
            <input
              id={`${id}-date`}
              type="date"
              className="input pl-11"
              value={date}
              min={dateDuJour()}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-accent h-[46px] w-full px-7 lg:w-auto"
          disabled={!gareId || chargementGares}
        >
          <Search className="h-4 w-4" />
          {submitLabel}
        </button>
      </div>

      {erreur && <p className="mt-3 text-xs font-semibold text-accent-600">{erreur}</p>}

      {variant === 'hero' && (
        <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Les horaires affichés sont prévisionnels. Le départ est déclenché dès que
          le véhicule atteint le seuil de remplissage de sa gare.
        </p>
      )}
    </form>
  )
}
