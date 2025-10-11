// src/lib/gelato.ts

// --- Environment & endpoints -----------------------------------------------
const IS_STAGING = (process.env.GELATO_ENV || '').toLowerCase() === 'staging'

export const GELATO_ORDER_BASE = IS_STAGING
  ? 'https://order-staging.gelatoapis.com/v3'
  : 'https://order.gelatoapis.com/v3'

export const GELATO_PRODUCT_BASE = IS_STAGING
  ? 'https://product-staging.gelatoapis.com/v3'
  : 'https://product.gelatoapis.com/v3'

export const defaultShipmentMethodUid =
  process.env.GELATO_SHIPMENT_METHOD_UID || 'STANDARD'

// --- Auth headers -----------------------------------------------------------
export function gelatoHeaders() {
  const key = process.env.GELATO_API_KEY
  if (!key) throw new Error('Missing GELATO_API_KEY')
  return {
    'Content-Type': 'application/json',
    'X-API-KEY': key,
  }
}

// --- Types ------------------------------------------------------------------
export type GelatoAddress = {
  firstName?: string
  lastName?: string
  name?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  postCode?: string
  state?: string
  country: string // ISO-2 required by Gelato
  email?: string
  phone?: string
}

// --- Helpers ----------------------------------------------------------------
export function splitName(full?: string): { firstName?: string; lastName?: string } {
  if (!full) return {}
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0] }
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.slice(-1).join(' ') }
}

export function normalizeCity(city?: string | null): string | undefined {
  if (!city) return undefined
  return city.replace(/\s*,\s*/g, ' ').trim() || undefined
}
