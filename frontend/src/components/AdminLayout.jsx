import { useEffect, useState } from 'react'
import {
  Car,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  ScanLine,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import AdminNotifications from './AdminNotifications'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'
import { cn, nomGare } from '../utils/format'

const LIENS = [
  { to: '/admin', label: 'Tableau de bord', icone: LayoutDashboard, end: true },
  { to: '/admin/vehicules', label: 'Véhicules', icone: Car },
  { to: '/admin/scan', label: 'Scan des billets', icone: ScanLine },
]

function initiales(nom = '') {
  return nom
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join('')
    .toUpperCase()
}

export default function AdminLayout() {
  const { utilisateur, deconnecter } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOuvert, setMenuOuvert] = useState(false)

  useEffect(() => {
    setMenuOuvert(false)
  }, [location.pathname])

  function seDeconnecter() {
    deconnecter()
    navigate('/admin/login', { replace: true })
  }

  function ContenuSidebar() {
    return (
      <div className="relative flex h-full flex-col">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.06]" />
        <div className="relative px-5 pb-5 pt-6">
          <Logo inverted to="/admin" />
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-sun-500" />
            <div className="min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-primary-300">
                Espace responsable
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-white">
                <MapPin className="h-3 w-3 text-accent-500" />
                {utilisateur?.gare ? nomGare(utilisateur.gare.nom) : 'Gare'}
              </p>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 space-y-1 px-3 pt-3" aria-label="Navigation back-office">
          {LIENS.map((lien) => (
            <NavLink
              key={lien.to}
              to={lien.to}
              end={lien.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition',
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-primary-200 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <lien.icone className="h-4 w-4" />
              {lien.label}
            </NavLink>
          ))}
        </nav>

        <div className="relative border-t border-white/10 px-3 py-4">
          <Link
            to="/"
            className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-primary-300 transition hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Voir le site public
          </Link>
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sun-500 text-xs font-extrabold text-primary-900">
              {initiales(utilisateur?.nom)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{utilisateur?.nom}</p>
              <p className="truncate text-[9px] text-primary-300">{utilisateur?.email}</p>
            </div>
            <button
              type="button"
              onClick={seDeconnecter}
              className="rounded-lg p-2 text-primary-300 transition hover:bg-white/10 hover:text-white"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-primary-900 lg:block">
        <ContenuSidebar />
      </aside>

      {menuOuvert && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-primary-900/70 backdrop-blur-sm"
            onClick={() => setMenuOuvert(false)}
            aria-label="Fermer le menu"
          />
          <aside className="relative h-full w-[min(85vw,300px)] bg-primary-900 shadow-2xl">
            <button
              type="button"
              className="absolute right-3 top-4 z-10 rounded-lg p-2 text-primary-200 hover:bg-white/10 hover:text-white"
              onClick={() => setMenuOuvert(false)}
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
            <ContenuSidebar />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-200 p-2 text-primary-800 lg:hidden"
              onClick={() => setMenuOuvert(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <Logo className="scale-90 origin-left" />
            </div>
            <p className="hidden items-center gap-2 text-xs font-bold text-slate-400 lg:flex">
              <span className="h-2 w-2 animate-soft-pulse rounded-full bg-emerald-500" />
              Gare connectée · {utilisateur?.gare?.nom}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <AdminNotifications />
            <Link
              to="/departs"
              className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition hover:border-primary-200 hover:text-primary-800 sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Tableau public
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-800 text-[10px] font-extrabold text-white">
                {initiales(utilisateur?.nom)}
              </span>
              <span className="hidden text-xs font-bold text-primary-900 sm:block">
                {utilisateur?.nom?.split(' ')[0]}
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
