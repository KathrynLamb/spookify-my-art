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
  currency: 'GBP'|'USD'|'EUR'
  channel?: 'api'
  shippingAddress: GelatoAddress
  items: Item[]
  shipments: Array<{
    shipmentReferenceId: string
    shipmentMethodUid: string
    items: Array<{ itemReferenceId: string }>
  }>
}

const STAGING = 'https://order-staging.gelatoapis.com/v3/orders'
const PROD    = 'https://order.gelatoapis.com/v3/orders'

function authHeaders() {
  const key = process.env.GELATO_API_KEY
  if (!key) throw new Error('Missing GELATO_API_KEY')
  return { 'X-API-KEY': key, 'Content-Type': 'application/json' }
}

async function tryPost(url: string, body: unknown) {
  const r = await fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) })
  const text = await r.text()
  let json: unknown
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { ok: r.ok, status: r.status, json }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as OrderPayload

    // Minimal validation to catch silent nulls
    if (!payload?.shippingAddress?.addressLine1 || !payload?.shippingAddress?.city || !payload?.shippingAddress?.postCode || !payload?.shippingAddress?.country) {
      console.warn('[Gelato] Missing address fields', payload?.shippingAddress)
    }

    console.log('[Gelato] POST', STAGING)
    let res = await tryPost(STAGING, payload)
    if (!res.ok) {
      console.warn('[Gelato] staging failed; retrying prod', res.status, res.json)
      res = await tryPost(PROD, payload)
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Gelato order failed', raw: res.json },
        { status: res.status || 500 },
      )
    }
    return NextResponse.json({ ok: true, gelato: res.json })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[Gelato] place-order error', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
