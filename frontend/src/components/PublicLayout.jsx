import { useEffect, useState } from 'react'
import { Menu, ShieldCheck, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import Logo from './Logo'
import Footer from './Footer'
import { cn } from '../utils/format'

const LIENS = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/departs', label: 'Départs en direct' },
]

export default function PublicLayout() {
  const [menuOuvert, setMenuOuvert] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOuvert(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  const lienActif = ({ isActive }) =>
    cn(
      'rounded-full px-4 py-2 text-sm font-semibold transition',
      isActive
        ? 'bg-primary-50 text-primary-800'
        : 'text-slate-500 hover:bg-slate-50 hover:text-primary-800',
    )

  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-1 bg-gradient-to-r from-primary-800 via-sun-500 to-accent-500" />
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="container-page flex h-[76px] items-center justify-between gap-5">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
            {LIENS.map((lien) => (
              <NavLink key={lien.to} to={lien.to} end={lien.end} className={lienActif}>
                {lien.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-primary-800 transition hover:border-primary-200 hover:bg-primary-50 sm:inline-flex"
            >
              <ShieldCheck className="h-4 w-4 text-accent-500" />
              Espace gare
            </Link>
            <button
              type="button"
              className="rounded-xl border border-slate-200 p-2.5 text-primary-800 lg:hidden"
              onClick={() => setMenuOuvert((ouvert) => !ouvert)}
              aria-expanded={menuOuvert}
              aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {menuOuvert ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOuvert && (
          <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Navigation mobile">
              {LIENS.map((lien) => (
                <NavLink
                  key={lien.to}
                  to={lien.to}
                  end={lien.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold',
                      isActive
                        ? 'bg-primary-50 text-primary-800'
                        : 'text-slate-600 hover:bg-slate-50',
                    )
                  }
                >
                  {lien.label}
                  <span className="text-slate-300">→</span>
                </NavLink>
              ))}
              <Link
                to="/admin"
                className="mt-2 flex items-center gap-2 rounded-xl bg-primary-800 px-4 py-3 text-sm font-bold text-white"
              >
                <ShieldCheck className="h-4 w-4 text-sun-500" />
                Accéder à l’espace gare
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
