import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Clock,
  MapPin,
  Phone,
  Radio,
  RefreshCw,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import CooperativeHeader from '../components/CooperativeHeader'
import EmptyState from '../components/EmptyState'
import OccupancyBar from '../components/OccupancyBar'
import StatusBadge from '../components/StatusBadge'
import { Spinner } from '../components/Loading'
import {
  dateDuJour,
  formatDateJour,
  getErrorMessage,
  grouperVehiculesParCooperative,
  nomGare,
} from '../utils/format'

export default function DeparturesPage() {
  const [gares, setGares] = useState([])
  const [gareId, setGareId] = useState('')
  const [departs, setDeparts] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [derniereMaj, setDerniereMaj] = useState(null)
  const [maintenant, setMaintenant] = useState(Date.now())
  const [refreshToken, setRefreshToken] = useState(0)
  const [rafraichissement, setRafraichissement] = useState(false)

  useEffect(() => {
    let actif = true
    api
      .getGares()
      .then((donnees) => {
        if (!actif) return
        setGares(donnees)
        setGareId((courant) => courant || (donnees[0] ? String(donnees[0].id) : ''))
      })
      .catch((error) => {
        if (actif) setErreur(getErrorMessage(error))
      })
    return () => {
      actif = false
    }
  }, [])

  useEffect(() => {
    if (!gareId) return undefined
    let actif = true

    async function charger() {
      try {
        const donnees = await api.getPublicDepartures({
          gareId,
          date: dateDuJour(),
        })
        if (!actif) return
        setDeparts(donnees)
        setDerniereMaj(new Date())
        setErreur('')
      } catch (error) {
        if (actif) setErreur(getErrorMessage(error))
      } finally {
        if (actif) {
          setChargement(false)
          setRafraichissement(false)
        }
      }
    }

    setChargement(true)
    charger()
    const polling = window.setInterval(charger, 30000)
    const horloge = window.setInterval(() => setMaintenant(Date.now()), 1000)

    return () => {
      actif = false
      window.clearInterval(polling)
      window.clearInterval(horloge)
    }
  }, [gareId, refreshToken])

  const gare = gares.find((item) => String(item.id) === String(gareId))
  const enAttente = useMemo(
    () => departs.filter((depart) => depart.statut === 'en_attente').length,
    [departs],
  )
  const groupes = useMemo(
    () => grouperVehiculesParCooperative(departs),
    [departs],
  )

  const secondesRestantes = derniereMaj
    ? Math.max(0, 30 - Math.floor((maintenant - derniereMaj.getTime()) / 1000))
    : 30

  function rafraichir() {
    setRafraichissement(true)
    setRefreshToken((valeur) => valeur + 1)
  }

  return (
    <div className="bg-paper">
      <section className="relative overflow-hidden bg-primary-900 text-white">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.09]" />
        <span className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[34px] border-white/5" />
        <div className="container-page relative py-10 lg:py-14">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-sun-400">
                <Radio className="h-3.5 w-3.5" />
                Tableau en direct
              </span>
              <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                Départs du jour
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-primary-200">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-accent-500" />
                  {gare ? nomGare(gare.nom) : 'Gares d’Antsirabe'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-sun-500" />
                  {formatDateJour(dateDuJour())}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary-300">
                  Mise à jour
                </p>
                <p className="mt-0.5 text-xs font-bold text-white">
                  {derniereMaj
                    ? `${derniereMaj.toLocaleTimeString('fr-FR')} · dans ${secondesRestantes}s`
                    : 'En cours…'}
                </p>
              </div>
              <button
                type="button"
                onClick={rafraichir}
                disabled={rafraichissement || !gareId}
                className="btn-sun px-4 py-3"
                aria-label="Actualiser le tableau maintenant"
              >
                <RefreshCw className={`h-4 w-4 ${rafraichissement ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>
        </div>
        <div className="h-1.5 bg-gradient-to-r from-sun-500 via-accent-500 to-primary-500" />
      </section>

      <section className="container-page py-8 lg:py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="inline-flex w-full rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto">
            {gares.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setGareId(String(item.id))}
                className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-bold transition sm:flex-none ${
                  String(item.id) === String(gareId)
                    ? 'bg-primary-900 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-primary-800'
                }`}
              >
                {item.nom}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="h-2 w-2 animate-soft-pulse rounded-full bg-emerald-500" />
              {enAttente} départ{enAttente > 1 ? 's' : ''} en attente
            </span>
            <Link
              to={`/recherche?gare=${gareId}&date=${dateDuJour()}`}
              className="btn-primary px-4 py-2.5"
            >
              Réserver un départ
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {erreur && departs.length > 0 && (
          <p className="mt-4 rounded-xl border border-accent-100 bg-accent-50 px-4 py-2.5 text-xs font-semibold text-accent-700">
            {erreur} Les dernières données connues restent affichées.
          </p>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
          <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400 md:grid">
            <div className="col-span-2">Départ</div>
            <div className="col-span-3">Destination</div>
            <div className="col-span-2">Chauffeur / contact</div>
            <div className="col-span-3">Remplissage</div>
            <div className="col-span-2 text-right">Statut</div>
          </div>

          {chargement ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-slate-400">
              <Spinner className="h-6 w-6 text-primary-600" />
              <p className="text-xs font-semibold">Chargement des départs…</p>
            </div>
          ) : departs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Aucun départ aujourd’hui"
                description={
                  erreur ||
                  'Aucun véhicule n’est programmé pour cette gare. Revenez plus tard ou consultez l’autre gare.'
                }
                action={
                  <button type="button" onClick={rafraichir} className="btn-secondary">
                    <RefreshCw className="h-4 w-4" />
                    Réessayer
                  </button>
                }
              />
            </div>
          ) : (
            <div className="space-y-4 bg-slate-50/40 p-3 sm:p-4">
              {groupes.map((groupe) => (
                <div
                  key={groupe.cooperative?.id ?? 'sans-cooperative'}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <div className="p-3">
                    <CooperativeHeader
                      cooperative={groupe.cooperative}
                      nombre={groupe.vehicules.length}
                    />
                  </div>

                  <div className="divide-y divide-slate-100 border-t border-slate-100">
                    {groupe.vehicules.map((depart) => {
                      const inactif = depart.statut !== 'en_attente'
                      const telephone = depart.chauffeur_telephone
                      return (
                        <div
                          key={depart.id}
                          className={`grid grid-cols-1 gap-4 px-5 py-4 transition hover:bg-slate-50/70 md:grid-cols-12 md:items-center ${
                            inactif ? 'opacity-65' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between md:col-span-2 md:block">
                            <p className="font-display text-lg font-extrabold text-primary-900">
                              {depart.heure_depart}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 md:mt-0.5">
                              estimé {depart.creneau.split(' - ')[1]}
                            </p>
                          </div>

                          <div className="md:col-span-3">
                            <div className="flex items-center gap-2 md:block">
                              <p className="font-display text-base font-bold text-primary-900">
                                {depart.destination}
                              </p>
                              <p className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 md:mt-1 md:inline-block">
                                {nomGare(depart.gare?.nom)}
                              </p>
                            </div>
                            <p className="mt-1 text-[10px] font-semibold text-slate-400">
                              {depart.matricule}
                            </p>
                          </div>

                          <div className="md:col-span-2">
                            <p className="text-sm font-semibold text-slate-600">
                              {depart.chauffeur}
                            </p>
                            {telephone && (
                              <a
                                href={`tel:${telephone.replace(/[^0-9+]/g, '')}`}
                                className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold text-primary-600 transition hover:text-accent-500"
                              >
                                <Phone className="h-3 w-3" />
                                {telephone}
                              </a>
                            )}
                          </div>

                          <div className="md:col-span-3">
                            <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] font-bold text-slate-400">
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="h-3 w-3" />
                                {depart.occupation}/{depart.capacite} passagers
                              </span>
                              <span>{depart.taux_remplissage} %</span>
                            </div>
                            <OccupancyBar
                              valeur={depart.taux_remplissage}
                              seuil={depart.seuil_remplissage}
                            />
                          </div>

                          <div className="flex items-center justify-between gap-3 md:col-span-2 md:justify-end">
                            <StatusBadge statut={depart.statut} />
                            {depart.statut === 'annule' &&
                              depart.cancellation_reason && (
                                <span
                                  className="max-w-28 truncate text-[9px] text-slate-400"
                                  title={depart.cancellation_reason}
                                >
                                  {depart.cancellation_reason}
                                </span>
                              )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-400">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sun-500" />
              En attente de passagers
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Départ validé
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent-500" />
              Départ annulé
            </span>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold text-primary-700 transition hover:text-accent-500"
          >
            Espace agent de gare
          </Link>
        </div>

        <p className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[11px] leading-relaxed text-slate-400">
          Les horaires affichés sont des créneaux prévisionnels. Un taxi-brousse
          ne part pas à heure fixe&nbsp;: le responsable de gare valide le départ
          lorsque le véhicule atteint le seuil de remplissage recommandé. Ce
          tableau est actualisé automatiquement toutes les 30 secondes.
        </p>
      </section>
    </div>
  )
}
