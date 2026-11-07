import {
  Bitcoin,
  CreditCard,
  Smartphone,
  Wallet,
} from 'lucide-react'
import { cn } from '../utils/format'

export const MOYENS_PAIEMENT = [
  {
    id: 'mvola',
    label: 'MVola',
    description: 'Mobile money Telma',
    icone: Smartphone,
    couleur: 'text-amber-600 bg-amber-50',
  },
  {
    id: 'orange_money',
    label: 'Orange Money',
    description: 'Mobile money Orange',
    icone: Smartphone,
    couleur: 'text-orange-600 bg-orange-50',
  },
  {
    id: 'airtel_money',
    label: 'Airtel Money',
    description: 'Mobile money Airtel',
    icone: Smartphone,
    couleur: 'text-red-600 bg-red-50',
  },
  {
    id: 'carte_bancaire',
    label: 'Carte bancaire',
    description: 'Visa · Mastercard',
    icone: CreditCard,
    couleur: 'text-primary-700 bg-primary-50',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    description: 'Paiement international',
    icone: Wallet,
    couleur: 'text-sky-600 bg-sky-50',
  },
  {
    id: 'bitcoin',
    label: 'Bitcoin',
    description: 'Crypto-monnaie',
    icone: Bitcoin,
    couleur: 'text-[#f7931a] bg-orange-50',
  },
]

export function libelleMoyen(id) {
  return MOYENS_PAIEMENT.find((moyen) => moyen.id === id)?.label || id
}

export default function PaymentMethodPicker({ value, onChange }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {MOYENS_PAIEMENT.map((moyen) => {
        const actif = value === moyen.id
        return (
          <button
            key={moyen.id}
            type="button"
            onClick={() => onChange(moyen.id)}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition',
              actif
                ? 'border-primary-700 bg-primary-50 ring-2 ring-primary-700/15'
                : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50',
            )}
            aria-pressed={actif}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                moyen.couleur,
              )}
            >
              <moyen.icone className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-extrabold text-primary-900">
                {moyen.label}
              </span>
              <span className="block truncate text-[10px] text-slate-400">
                {moyen.description}
              </span>
            </span>
            <span
              className={cn(
                'ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                actif
                  ? 'border-primary-700 bg-primary-700'
                  : 'border-slate-300',
              )}
            >
              {actif && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
