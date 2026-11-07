import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../utils/format'

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return undefined
    const fermerSurEchap = (event) => {
      if (event.key === 'Escape') onClose()
    }
    const overflowInitial = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', fermerSurEchap)
    return () => {
      document.body.style.overflow = overflowInitial
      window.removeEventListener('keydown', fermerSurEchap)
    }
  }, [open, onClose])

  if (!open) return null

  const tailles = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-primary-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl',
          tailles[size],
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 id={titleId} className="font-display text-xl font-bold text-primary-900">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
