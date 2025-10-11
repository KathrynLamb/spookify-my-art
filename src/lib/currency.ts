export type Currency = 'GBP' | 'USD' | 'EUR'

export const CURRENCIES: { id: Currency; label: string; symbol: string }[] = [
  { id: 'GBP', label: 'United Kingdom (GBP)', symbol: '£' },
  { id: 'USD', label: 'United States (USD)', symbol: '$' },
  { id: 'EUR', label: 'European Union (EUR)', symbol: '€' },
]

export const symOf = (c: Currency) =>
  CURRENCIES.find(x => x.id === c)?.symbol ?? '£'

export const toMinor = (n: number) => Math.round(n * 100)

/** Minimal, consistent money formatting (no locale surprises). */
export function fmtMoney(n?: number, c: Currency = 'GBP') {
  if (!Number.isFinite(n)) return '—'
  return `${symOf(c)}${(n as number).toFixed(2)}`
}

// If you had a previous helper named formatMoney, keep this alias to avoid breakage:
export const formatMoney = fmtMoney
