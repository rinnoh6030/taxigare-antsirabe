import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bell,
  CheckCircle2,
  CreditCard,
  Ticket,
  Users,
  X,
} from 'lucide-react'
import { api } from '../api/client'
import { formatDateHeure, formatPrice } from '../utils/format'

const VUES_KEY = 'taxigare_notifications_vues'

function idsVues() {
  try {
    const valeur = JSON.parse(localStorage.getItem(VUES_KEY) || '[]')
    return new Set(Array.isArray(valeur) ? valeur : [])
  } catch {
    return new Set()
  }
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [nonLues, setNonLues] = useState(0)
  const [ouvert, setOuvert] = useState(false)
  const [toast, setToast] = useState(null)
  const connuRef = useRef(new Set())
  const vuesRef = useRef(idsVues())
  const premiereChargeRef = useRef(true)

  const charger = useCallback(async () => {
    try {
      const donnees = await api.getNotifications()
      setNotifications(donnees)

      if (premiereChargeRef.current) {
        premiereChargeRef.current = false
        const nonVues = donnees.filter(
          (item) => !vuesRef.current.has(item.id),
        ).length
        setNonLues(nonVues)
        donnees.forEach((item) => connuRef.current.add(item.id))
        return
      }

      const nouvelles = donnees.filter(
        (item) => !connuRef.current.has(item.id),
      )
      donnees.forEach((item) => connuRef.current.add(item.id))
      if (nouvelles.length > 0) {
        setNonLues((nombre) => nombre + nouvelles.length)
        setToast(nouvelles[0])
      }
    } catch {
      // Les notifications ne doivent pas bloquer le back-office.
    }
  }, [])

  useEffect(() => {
    charger()
    const minuteur = window.setInterval(charger, 20000)
    return () => window.clearInterval(minuteur)
  }, [charger])

  useEffect(() => {
    if (!toast) return undefined
    const minuteur = window.setTimeout(() => setToast(null), 6000)
    return () => window.clearTimeout(minuteur)
  }, [toast])

  function marquerVues() {
    const ids = notifications.map((item) => item.id)
    ids.forEach((id) => vuesRef.current.add(id))
    const liste = Array.from(vuesRef.current).slice(-250)
    localStorage.setItem(VUES_KEY, JSON.stringify(liste))
    setNonLues(0)
  }

  function basculer() {
    setOuvert((valeur) => {
      const suivant = !valeur
      if (suivant) marquerVues()
      return suivant
    })
  }

  return (
    <div className="relative">
      {toast && (
        <div className="fixed right-4 top-20 z-[60] w-[min(92vw,340px)] animate-fade-up rounded-xl border border-primary-100 bg-white px-4 py-3 shadow-card">
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sun-100 text-primary-800">
              <Ticket className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-primary-900">
                Nouvelle réservation
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                {toast.nom_passager} · {toast.nombre_places}{' '}
                {toast.nombre_places > 1 ? 'places' : 'place'} vers{' '}
                {toast.vehicule?.destination}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              aria-label="Fermer la notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={basculer}
        className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-primary-800 transition hover:border-primary-200 hover:bg-primary-50"
        aria-label="Notifications des réservations"
        aria-expanded={ouvert}
      >
        <Bell className="h-4 w-4" />
        {nonLues > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-extrabold text-white">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOuvert(false)}
            aria-label="Fermer les notifications"
          />
          <div className="absolute right-0 top-12 z-50 w-[min(90vw,360px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-xs font-extrabold text-primary-900">
                  Réservations récentes
                </p>
                <p className="text-[10px] text-slate-400">
                  Notification à chaque nouvelle réservation
                </p>
              </div>
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[9px] font-bold text-primary-700">
                {notifications.length}
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-slate-400">
                  Aucune réservation pour le moment.
                </p>
              ) : (
                notifications.map((item) => {
                  const paye = item.payment_status === 'paye'
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 border-b border-slate-50 px-4 py-3 last:border-0"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          paye
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {paye ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-primary-900">
                          {item.nom_passager}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                          <Users className="h-3 w-3 shrink-0" />
                          {item.nombre_places}{' '}
                          {item.nombre_places > 1 ? 'places' : 'place'} ·{' '}
                          {item.vehicule?.destination}
                        </p>
                        <p className="mt-0.5 text-[9px] text-slate-400">
                          {formatDateHeure(item.created_at)} ·{' '}
                          {paye ? 'Payé' : 'Paiement en attente'}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] font-extrabold text-accent-500">
                        {formatPrice(item.total)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
