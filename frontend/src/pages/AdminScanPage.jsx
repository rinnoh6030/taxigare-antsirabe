import { Link } from 'react-router-dom'
import { ArrowLeft, ScanLine } from 'lucide-react'
import ScannerPanel from '../components/ScannerPanel'

export default function AdminScanPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-primary-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au tableau de bord
        </Link>
        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-accent-500">
              <ScanLine className="h-3.5 w-3.5" />
              Embarquement
            </span>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary-900">
              Scan des billets
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
              Validez la présence des passagers avant le départ. Le billet passe
              immédiatement au statut « Embarqué ».
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-500 shadow-sm">
            Caméra ou saisie manuelle du code
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,640px)_1fr]">
        <ScannerPanel />
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold text-primary-900">
            Bonnes pratiques
          </h2>
          <ul className="mt-4 space-y-3 text-xs leading-relaxed text-slate-500">
            <li className="flex gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sun-500" />
              Vérifiez que le nom affiché correspond au passager présent.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sun-500" />
              Un billet ne peut être validé qu’une seule fois.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sun-500" />
              Les billets de départs annulés sont automatiquement refusés.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sun-500" />
              Utilisez la saisie manuelle si la caméra n’est pas disponible.
            </li>
          </ul>
          <div className="mt-5 rounded-xl bg-primary-50 px-4 py-3 text-[11px] leading-relaxed text-primary-700">
            Le compteur de places réservées et le tableau public sont mis à jour
            automatiquement après chaque scan.
          </div>
        </aside>
      </div>
    </div>
  )
}
