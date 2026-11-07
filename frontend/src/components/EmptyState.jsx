import { Route } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Route,
  title,
  description,
  action,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-5 font-display text-lg font-bold text-primary-900">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
