import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { Spinner } from '../components/Loading'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/format'

const COMPTES_DEMO = [
  {
    gare: 'Asabotsy',
    email: 'asabotsy@taxigare.mg',
    motDePasse: 'asabotsy2026',
    seuil: '70 %',
  },
  {
    gare: 'Vatofotsy',
    email: 'vatofotsy@taxigare.mg',
    motDePasse: 'vatofotsy2026',
    seuil: '90 %',
  },
]

export default function AdminLoginPage() {
  const { connecter, estConnecte, chargement } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const destination = location.state?.from?.pathname || '/admin'

  useEffect(() => {
    document.title = 'Connexion responsable · TaxiGare'
    return () => {
      document.title = 'TaxiGare · Taxis-brousses d’Antsirabe'
    }
  }, [])

  if (!chargement && estConnecte) {
    return <Navigate to="/admin" replace />
  }

  function remplirCompte(compte) {
    setEmail(compte.email)
    setMotDePasse(compte.motDePasse)
    setErreur('')
  }

  async function soumettre(event) {
    event.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      await connecter(email.trim(), motDePasse)
      navigate(destination.startsWith('/admin/login') ? '/admin' : destination, {
        replace: true,
      })
    } catch (error) {
      setErreur(getErrorMessage(error))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-primary-900 p-10 text-white lg:flex xl:p-14">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.08]" />
        <span className="absolute -right-24 top-28 h-64 w-64 rounded-full border-[36px] border-white/5" />
        <span className="absolute -bottom-16 -left-20 h-52 w-52 rounded-full bg-accent-500/10 blur-2xl" />

        <div className="relative">
          <Logo inverted />
          <div className="mt-14 max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-sun-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Back-office gare
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
              Chaque départ commence par une gare bien informée.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-primary-200">
              Suivez le remplissage en temps réel, confirmez les départs et
              validez les embarquements depuis un seul tableau de bord.
            </p>
          </div>
        </div>

        <div className="relative mt-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-primary-300">
                  Règle de départ
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  Le remplissage déclenche le voyage
                </p>
              </div>
              <MapPin className="h-5 w-5 text-sun-500" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {COMPTES_DEMO.map((compte) => (
                <div
                  key={compte.gare}
                  className="rounded-xl border border-white/10 bg-primary-800/70 px-3 py-2.5"
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider text-primary-300">
                    {compte.gare}
                  </p>
                  <p className="mt-1 font-display text-xl font-extrabold text-sun-400">
                    {compte.seuil}
                  </p>
                  <p className="text-[9px] text-primary-300">seuil conseillé</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 text-[10px] text-primary-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Chaque responsable ne gère que les départs de sa gare.
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-5 sm:p-7">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-primary-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour au site
          </Link>
          <div className="lg:hidden">
            <Logo />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-2 sm:px-8">
          <div className="w-full max-w-md">
            <div>
              <span className="eyebrow">Espace sécurisé</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-primary-900 sm:text-4xl">
                Connexion responsable
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Identifiez-vous pour accéder au tableau de bord de votre gare.
              </p>
            </div>

            <form onSubmit={soumettre} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="label">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="field-icon" />
                  <input
                    id="email"
                    type="email"
                    className="input pl-11"
                    placeholder="responsable@taxigare.mg"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mot-de-passe" className="label">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="field-icon" />
                  <input
                    id="mot-de-passe"
                    type={afficherMotDePasse ? 'text' : 'password'}
                    className="input pl-11 pr-12"
                    placeholder="Votre mot de passe"
                    value={motDePasse}
                    onChange={(event) => setMotDePasse(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setAfficherMotDePasse((valeur) => !valeur)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                    aria-label={
                      afficherMotDePasse
                        ? 'Masquer le mot de passe'
                        : 'Afficher le mot de passe'
                    }
                  >
                    {afficherMotDePasse ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {erreur && (
                <div
                  role="alert"
                  className="rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-700"
                >
                  {erreur}
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-3.5" disabled={envoi}>
                {envoi ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Connexion…
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Comptes de démonstration
              </p>
              <div className="mt-3 grid gap-2.5">
                {COMPTES_DEMO.map((compte) => (
                  <button
                    key={compte.email}
                    type="button"
                    onClick={() => remplirCompte(compte)}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-primary-200 hover:bg-primary-50/50"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-primary-900">
                        Gare {compte.gare === 'Asabotsy' ? 'd’' : 'de '}
                        {compte.gare}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                        {compte.email} · {compte.motDePasse}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-primary-600 opacity-0 transition group-hover:opacity-100">
                      Utiliser
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
                En production, ces comptes doivent être supprimés ou leurs mots
                de passe modifiés.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
