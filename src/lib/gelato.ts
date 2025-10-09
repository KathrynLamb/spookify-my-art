// src/lib/gelato.ts
const IS_STAGING = (process.env.GELATO_ENV || '').toLowerCase() === 'staging'

export const GELATO_ORDER_BASE   = IS_STAGING
  ? 'https://order-staging.gelatoapis.com/v3'
  : 'https://order.gelatoapis.com/v3'

export const GELATO_PRODUCT_BASE = IS_STAGING
  ? 'https://product-staging.gelatoapis.com/v3'
  : 'https://product.gelatoapis.com/v3'

export const defaultShipmentMethodUid =
  process.env.GELATO_SHIPMENT_METHOD_UID || 'STANDARD'

// Call when you need headers for Gelato requests
export function gelatoHeaders() {
  const key = process.env.GELATO_API_KEY
  if (!key) throw new Error('Missing GELATO_API_KEY')
  return {
    'Content-Type': 'application/json',
    'X-API-KEY': key,
  }
}
