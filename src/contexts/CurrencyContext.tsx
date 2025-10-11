'use client'

import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import type { Currency } from '@/lib/currency'
import { CURRENCIES } from '@/lib/currency'

type Ctx = {
  currency: Currency
  setCurrency: (c: Currency) => void
  options: typeof CURRENCIES
}

const CurrencyContext = createContext<Ctx | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('GBP')
  const value = useMemo<Ctx>(() => ({ currency, setCurrency, options: CURRENCIES }), [currency])
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
