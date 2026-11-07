import { cn, libelleStatut } from '../utils/format'

const STYLES = {
  en_attente: 'bg-sun-100 text-[#82650d]',
  parti: 'bg-emerald-50 text-emerald-700',
  annule: 'bg-accent-50 text-accent-700',
  reserve: 'bg-primary-50 text-primary-700',
  embarque: 'bg-emerald-50 text-emerald-700',
}

const POINTS = {
  en_attente: 'bg-sun-500',
  parti: 'bg-emerald-500',
  annule: 'bg-accent-500',
  reserve: 'bg-primary-500',
  embarque: 'bg-emerald-500',
}

export default function StatusBadge({ statut, className }) {
  return (
    <span className={cn('badge', STYLES[statut] || 'bg-slate-100 text-slate-600', className)}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          POINTS[statut] || 'bg-slate-400',
          statut === 'en_attente' && 'animate-soft-pulse',
        )}
      />
      {libelleStatut(statut)}
    </span>
  )
}
