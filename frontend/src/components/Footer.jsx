import { ArrowUpRight, MapPin, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-primary-900 text-white">
      <div className="absolute inset-0 bg-dot-grid opacity-[0.08]" />
      <div className="container-page relative py-14">
        <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo inverted />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-primary-200">
              La plateforme qui simplifie les départs des taxis-brousses
              d’Antsirabe. Réservez votre place, présentez votre QR code et
              laissez la gare gérer le remplissage.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-primary-100">
              <MapPin className="h-3.5 w-3.5 text-sun-500" />
              Antsirabe, Vakinankaratra
            </p>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-300">
              Les gares
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-primary-100">
              <li>
                <span className="font-bold text-white">Asabotsy</span>
                <span className="mt-0.5 block text-xs text-primary-300">
                  Betafo · Mandoto · Ankazomiritra
                </span>
              </li>
              <li>
                <span className="font-bold text-white">Vatofotsy</span>
                <span className="mt-0.5 block text-xs text-primary-300">
                  Antananarivo · Fianarantsoa · Ambositra
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-300">
              Accès rapide
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link to="/departs" className="inline-flex items-center gap-1.5 text-primary-100 transition hover:text-sun-500">
                  Départs en direct
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/admin" className="inline-flex items-center gap-1.5 text-primary-100 transition hover:text-sun-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Espace responsable
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-xs text-primary-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TaxiGare · Prototype de soutenance.</p>
          <p>Départs au remplissage · Billets numériques · Suivi en direct</p>
        </div>
      </div>
    </footer>
  )
}
