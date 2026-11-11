import { Building2, Phone } from 'lucide-react'

export default function CooperativeHeader({ cooperative, nombre }) {
  const nom = cooperative?.nom || 'Coopérative non renseignée'
  const telephone = cooperative?.telephone
  const lienTelephone = telephone
    ? `tel:${telephone.replace(/[^0-9+]/g, '')}`
    : null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-primary-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm">
          <Building2 className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary-400">
            Coopérative
          </p>
          <p className="truncate font-display text-sm font-extrabold text-primary-900">
            Coopérative {nom}
            {telephone && (
              <span className="font-sans text-xs font-semibold text-primary-600">
                {' '}
                - Secrétariat : {telephone}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {typeof nombre === 'number' && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-500">
            {nombre} départ{nombre > 1 ? 's' : ''}
          </span>
        )}
        {lienTelephone && (
          <a
            href={lienTelephone}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-extrabold text-primary-700 shadow-sm transition hover:bg-primary-900 hover:text-white"
          >
            <Phone className="h-3.5 w-3.5" />
            Appeler la coopérative
          </a>
        )}
      </div>
    </div>
  )
}
