// src/app/api/gelato/place-order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type { GelatoAddress } from '@/lib/gelato'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Item = {
  itemReferenceId: string
  productUid: string
  quantity: number
  fileUrl: string
  attributes?: Record<string, string>
}

type OrderPayload = {
  orderReferenceId: string
  orderType?: 'order'
  currency: 'GBP' | 'USD' | 'EUR'
  channel?: 'api'
  shippingAddress: Partial<GelatoAddress> & Record<string, unknown>
  items: Item[]
  shipments: Array<{
    shipmentReferenceId: string
    shipmentMethodUid: string
    items: Array<{ itemReferenceId: string }>
  }>
}

const STAGING = 'https://order-staging.gelatoapis.com/v3/orders'
const PROD = 'https://order.gelatoapis.com/v3/orders'

function authHeaders() {
  const key = process.env.GELATO_API_KEY
  if (!key) throw new Error('Missing GELATO_API_KEY')
  return { 'X-API-KEY': key, 'Content-Type': 'application/json' }
}

async function tryPost(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  return { ok: res.ok, status: res.status, json }
}

// Always return a string; no `any`, no unions.
function getStr(src: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const k of keys) {
    const v = src[k]
    if (typeof v === 'string' && v.trim().length > 0) return v
  }
  return fallback
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as OrderPayload
    const src: Record<string, unknown> = payload?.shippingAddress ?? {}

    // 1) Normalize to GelatoAddress (all strings)
    const shipping: GelatoAddress = {
      firstName: getStr(src, ['firstName', 'first_name'], 'Customer'),
      lastName: getStr(src, ['lastName', 'last_name'], ''),
      addressLine1: getStr(src, ['addressLine1', 'address_line_1', 'address1'], 'Unknown address'),
      addressLine2: getStr(src, ['addressLine2', 'address_line_2'], ''),
      city: getStr(src, ['city', 'admin_area_2'], 'Unknown city'),
      postCode: getStr(src, ['postCode', 'postal_code', 'zip'], ''),
      country: getStr(src, ['country', 'country_code'], 'GB'),
      email: getStr(src, ['email'], 'orders@aigifts.org'),
      phone: getStr(src, ['phone'], ''),
      name: undefined, // not used when first/last present
    }

    // 2) Validate core fields (log but don’t hard fail)
    const missing = (['addressLine1', 'city', 'postCode', 'country'] as const)
      .filter((f) => !shipping[f] || !shipping[f].toString().trim())
    if (missing.length) console.warn('[Gelato] Missing address fields:', missing, shipping)

    const orderBody = {
      ...payload,
      shippingAddress: shipping,
      orderType: 'order',
      channel: 'api',
    }

    // 3) Attempt STAGING then PROD
    let res = await tryPost(STAGING, orderBody)
    if (!res.ok) {
      console.warn('[Gelato] Staging failed; retrying PROD', res.status, res.json)
      res = await tryPost(PROD, orderBody)
    }

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: 'Gelato order failed', raw: res.json },
        { status: res.status || 500 }
      )
    }

    return NextResponse.json({ ok: true, gelato: res.json })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Gelato] place-order fatal error', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
