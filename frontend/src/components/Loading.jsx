import { Loader2 } from 'lucide-react'
import { cn } from '../utils/format'

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin', className)} aria-hidden="true" />
}

export function PageLoader({ label = 'Chargement de la page…' }) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 text-slate-500">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
        <Spinner className="h-6 w-6 text-primary-700" />
      </span>
      <p className="text-sm font-semibold">{label}</p>
    </div>
  )
}

export function InlineLoader({ label = 'Chargement…' }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
      <Spinner className="h-4 w-4" />
      {label}
    </span>
  )
}
