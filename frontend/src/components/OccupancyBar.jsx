import { cn } from '../utils/format'

export default function OccupancyBar({
  valeur = 0,
  capacite = 1,
  seuil = 70,
  showMarker = true,
  className,
  barClassName,
}) {
  const pourcentage = Math.max(0, Math.min(100, Number(valeur || 0)))
  const atteint = pourcentage >= seuil

  return (
    <div className={cn('relative h-2 w-full rounded-full bg-slate-100', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          atteint ? 'bg-primary-700' : 'bg-sun-500',
          barClassName,
        )}
        style={{ width: `${pourcentage}%` }}
      />
      {showMarker && seuil > 0 && seuil < 100 && (
        <span
          className="absolute -top-1 h-4 w-px bg-slate-400/80"
          style={{ left: `${seuil}%` }}
          title={`Seuil recommandé : ${seuil} %`}
        />
      )}
    </div>
  )
}
