import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  ScanLine,
  Search,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import SearchForm from '../components/SearchForm'
import { Spinner } from '../components/Loading'
import {
  dateDuJour,
  formatDateJour,
  formatPrice,
  nomGare,
} from '../utils/format'

const ETAPES = [
  {
    numero: '01',
    titre: 'Choisissez votre trajet',
    texte: 'Sélectionnez la gare, la destination et la date de votre voyage.',
    icone: Search,
  },
  {
    numero: '02',
    titre: 'Réservez vos places',
    texte: 'Indiquez vos coordonnées, choisissez vos places et payez en ligne. Le QR code arrive après paiement.',
    icone: Ticket,
  },
  {
    numero: '03',
    titre: 'Présentez votre QR code',
    texte: 'L’agent scanne votre billet à l’embarquement et valide votre présence.',
    icone: QrCode,
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [gares, setGares] = useState([])
  const [destinationsParGare, setDestinationsParGare] = useState({})
  const [departs, setDeparts] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true
    async function charger() {
      try {
        const [listeGares, departsPublics] = await Promise.all([
          api.getGares(),
          api.getPublicDepartures(),
        ])
        if (!actif) return
        setGares(listeGares)
        setDeparts(departsPublics)

        const entrees = await Promise.all(
          listeGares.map(async (gare) => [
            gare.id,
            await api.getDestinations(gare.id).catch(() => []),
          ]),
        )
        if (actif) setDestinationsParGare(Object.fromEntries(entrees))
      } catch {
        if (actif) {
          setErreur('Le tableau des départs est momentanément indisponible.')
        }
      } finally {
        if (actif) setChargement(false)
      }
    }
    charger()
    return () => {
      actif = false
    }
  }, [])

  const prochains = useMemo(
    () => departs.filter((depart) => depart.statut === 'en_attente').slice(0, 3),
    [departs],
  )

  const nombreDestinations = useMemo(() => {
    const noms = new Set()
    Object.values(destinationsParGare).forEach((liste) => {
      liste.forEach((destination) => noms.add(destination.nom))
    })
    return noms.size || 6
  }, [destinationsParGare])

  function lancerRecherche(criteres) {
    const params = new URLSearchParams({
      gare: String(criteres.gareId),
      date: criteres.date,
    })
    if (criteres.destination) params.set('destination', criteres.destination)
    navigate(`/recherche?${params.toString()}`)
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute -right-44 -top-44 h-[520px] w-[520px] rounded-full bg-primary-50" />
        <div className="pointer-events-none absolute -left-20 top-64 h-40 w-40 rounded-full bg-sun-100 blur-2xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-1.5 w-1/3 bg-gradient-to-r from-transparent via-sun-500 to-accent-500" />

        <div className="container-page relative">
          <div className="grid gap-12 pb-10 pt-14 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:pb-14 lg:pt-20">
            <div>
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                Gares routières d’Antsirabe
              </span>
              <h1 className="mt-5 max-w-2xl text-balance font-display text-[2.7rem] font-extrabold leading-[1.06] tracking-[-0.04em] text-primary-900 sm:text-6xl">
                Votre prochain départ,{' '}
                <span className="relative inline-block text-accent-500">
                  sans attendre.
                  <span className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-sun-400/60" />
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
                Réservez votre taxi-brousse depuis Asabotsy ou Vatofotsy. Les
                départs se font au remplissage&nbsp;: suivez le tableau en direct
                et embarquez avec un simple QR code.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Billet numérique après paiement
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Remplissage en temps réel
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/departs" className="btn-primary">
                  Voir les départs en direct
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#comment-ca-marche" className="btn-secondary">
                  Comment ça marche ?
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:ml-auto">
              <span className="absolute -right-5 top-8 hidden h-28 w-3 rounded-full bg-sun-500 sm:block" />
              <span className="absolute -right-5 top-40 hidden h-16 w-3 rounded-full bg-accent-500 sm:block" />
              <div className="overflow-hidden rounded-[28px] bg-primary-900 text-white shadow-card">
                <div className="relative border-b border-white/10 px-5 py-5 sm:px-6">
                  <div className="absolute inset-0 bg-dot-grid opacity-[0.09]" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary-300">
                        Départs en direct
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {formatDateJour(dateDuJour())}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-sun-400">
                      <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-sun-500" />
                      En direct
                    </span>
                  </div>
                </div>

                <div className="px-5 py-2 sm:px-6">
                  {chargement ? (
                    <div className="flex min-h-[218px] items-center justify-center">
                      <Spinner className="h-6 w-6 text-sun-500" />
                    </div>
                  ) : prochains.length === 0 ? (
                    <div className="flex min-h-[218px] flex-col items-center justify-center gap-2 text-center">
                      <Clock className="h-7 w-7 text-primary-300" />
                      <p className="text-sm font-semibold text-primary-100">
                        Aucun départ en attente pour le moment.
                      </p>
                      {erreur && <p className="text-xs text-accent-500">{erreur}</p>}
                    </div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {prochains.map((depart) => (
                        <div
                          key={depart.id}
                          className="flex items-center gap-4 py-4"
                        >
                          <div className="w-14 shrink-0 text-center">
                            <p className="font-display text-lg font-extrabold text-white">
                              {depart.heure_depart}
                            </p>
                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-300">
                              prévu
                            </p>
                          </div>
                          <div className="h-9 w-px bg-white/10" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold text-white">
                              {depart.destination}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-primary-300">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {nomGare(depart.gare?.nom)} ·{' '}
                                {depart.places_restantes} place
                                {depart.places_restantes > 1 ? 's' : ''} libre
                                {depart.places_restantes > 1 ? 's' : ''}
                              </span>
                            </p>
                          </div>
                          <div className="hidden shrink-0 text-right sm:block">
                            <p className="text-xs font-extrabold text-sun-400">
                              {formatPrice(depart.prix)}
                            </p>
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                              En attente
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-3 sm:px-6">
                  <span className="hidden items-center gap-2 sm:inline-flex">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-sun-400">
                      <QrCode className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-300">
                      Billet instantané · QR + PDF
                    </span>
                  </span>
                  <Link
                    to="/departs"
                    className="flex shrink-0 items-center gap-2 text-xs font-bold text-primary-200 transition hover:text-sun-500"
                  >
                    Consulter le tableau complet
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pb-14 lg:-mt-2">
            <SearchForm variant="hero" onSearch={lancerRecherche} />
            <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 px-1 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-accent-500" />
                {gares.length || 2} gares desservies
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-accent-500" />
                Départs au remplissage
              </span>
              <span className="flex items-center gap-2">
                <ScanLine className="h-3.5 w-3.5 text-accent-500" />
                Embarquement par QR code
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-accent-500" />
                {nombreDestinations} destinations
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-paper py-16 lg:py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <span className="eyebrow">Deux gares, deux logiques</span>
            <h2 className="section-title mt-4">
              Chaque gare part à son rythme.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-base">
              Asabotsy privilégie les départs rapides vers les environs, tandis
              que Vatofotsy attend un remplissage plus complet pour les longues
              distances. Le seuil de chaque gare reste visible, sans jamais
              bloquer la décision du responsable.
            </p>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-2">
            {(chargement ? [] : gares).map((gare, index) => {
              const destinations = destinationsParGare[gare.id] || []
              const estAsabotsy = gare.code === 'asabotsy'
              return (
                <article
                  key={gare.id}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-card sm:p-8"
                >
                  <span
                    className={`absolute inset-x-0 top-0 h-1.5 ${
                      estAsabotsy ? 'bg-accent-500' : 'bg-primary-700'
                    }`}
                  />
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                          estAsabotsy
                            ? 'bg-accent-50 text-accent-600'
                            : 'bg-primary-50 text-primary-700'
                        }`}
                      >
                        {index === 0 ? (
                          <MapPin className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </span>
                      <div>
                        <h3 className="font-display text-2xl font-bold text-primary-900">
                          {nomGare(gare.nom)}
                        </h3>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                          {estAsabotsy
                            ? 'Trajets proches et fréquents'
                            : 'Longues distances · ouverte 24h/24 en pointe'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        estAsabotsy
                          ? 'bg-accent-50 text-accent-700'
                          : 'bg-primary-50 text-primary-700'
                      }`}
                    >
                      Seuil {gare.seuil_remplissage} %
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-slate-500">
                    {gare.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {destinations.map((destination) => (
                      <span
                        key={destination.nom}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        {destination.nom}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                    <span className="text-xs font-semibold text-slate-400">
                      {formatPrice(
                        destinations[0]?.prix_indicatif || 0,
                      )}{' '}
                      minimum
                    </span>
                    <Link
                      to={`/recherche?gare=${gare.id}&date=${dateDuJour()}`}
                      className="inline-flex items-center gap-2 text-sm font-extrabold text-primary-800 transition group-hover:text-accent-500"
                    >
                      Rechercher
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              )
            })}
            {chargement && (
              <div className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-slate-200 text-slate-400 lg:col-span-2">
                <Spinner className="h-6 w-6" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="comment-ca-marche" className="scroll-mt-24 bg-white py-16 lg:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow justify-center">Simple comme un trajet</span>
            <h2 className="section-title mt-4">Trois étapes, zéro file d’attente.</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-base">
              Votre place est réservée en ligne. Le départ, lui, est déclenché par
              le responsable de gare selon le remplissage réel du véhicule.
            </p>
          </div>

          <div className="relative mt-12 grid gap-5 lg:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-10 hidden border-t-2 border-dashed border-slate-200 lg:block" />
            {ETAPES.map((etape) => (
              <article
                key={etape.numero}
                className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-900 text-white">
                    <etape.icone className="h-6 w-6" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sun-500 font-display text-[10px] font-extrabold text-primary-900">
                      {etape.numero}
                    </span>
                  </span>
                  <span className="font-display text-4xl font-extrabold text-slate-100">
                    {etape.numero}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-primary-900">
                  {etape.titre}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {etape.texte}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-16 lg:pb-24">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-[30px] bg-primary-900 px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
            <div className="absolute inset-0 bg-dot-grid opacity-10" />
            <span className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[28px] border-white/5" />
            <span className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-sun-500 via-accent-500 to-primary-500" />
            <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-sun-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Espace responsable
                </span>
                <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  La gare garde la main sur chaque départ.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-primary-200 sm:text-base">
                  Suivez le remplissage en temps réel, ajustez les passagers à
                  bord, validez le départ ou gérez un imprévu en un clic.
                </p>
              </div>
              <Link
                to="/admin"
                className="btn-sun shrink-0 px-6 py-3.5"
              >
                Ouvrir le back-office
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
