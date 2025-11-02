'use client'

import { formatMoney, type Currency } from '@/lib/currency'

export default function PriceTag({
  amount, currency,
}: { amount?: number; currency: Currency }) {
  if (amount == null) return <span className="text-white/60">—</span>
  return <span className="font-medium">{formatMoney(amount, currency)}</span>
}
