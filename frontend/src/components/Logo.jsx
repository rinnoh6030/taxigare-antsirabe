import { Bus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../utils/format'

export default function Logo({ inverted = false, to = '/', className }) {
  return (
    <Link
      to={to}
      className={cn('group inline-flex items-center gap-3', className)}
      aria-label="TaxiGare, retour à l’accueil"
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-800 shadow-sm">
        <span className="absolute inset-x-0 bottom-0 h-[5px] bg-sun-500" />
        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-accent-500" />
        <Bus className="h-6 w-6 -translate-y-0.5 text-white" strokeWidth={2.2} />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            'block font-display text-xl font-extrabold tracking-tight',
            inverted ? 'text-white' : 'text-primary-900',
          )}
        >
          Taxi<span className="text-accent-500">Gare</span>
        </span>
        <span
          className={cn(
            'mt-1 block text-[9px] font-extrabold uppercase tracking-[0.22em]',
            inverted ? 'text-primary-200' : 'text-slate-400',
          )}
        >
          Antsirabe · Madagascar
        </span>
      </span>
    </Link>
  )
}
