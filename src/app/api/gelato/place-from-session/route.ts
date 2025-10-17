import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Use production base unless Gelato instructed otherwise
const GELATO_BASE =
  (process.env.GELATO_BASE_URL?.replace(/\/+$/, '') || 'https://order.gelatoapis.com')
const GELATO_API_KEY = process.env.GELATO_API_KEY || ''

type Body = { session_id?: string }

type GelatoOrderResponse = { id: string; status?: string }

function isGelatoOrderResponse(x: unknown): x is GelatoOrderResponse {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.id === 'string' && (typeof o.status === 'string' || typeof o.status === 'undefined')
}

function splitName(full?: string) {
  const s = (full || '').trim()
  if (!s) return { firstName: 'Customer', lastName: '' }
  const parts = s.split(/\s+/)
  return parts.length === 1
    ? { firstName: parts[0], lastName: '' }
    : { firstName: parts.slice(0, -1).join(' '), lastName: parts.slice(-1).join(' ') }
}

function normalizeCity(v?: string | null) {
  return (v || '').trim()
}

export async function POST(req: NextRequest) {
  try {
    const { session_id } = (await req.json()) as Body
    if (!session_id) {
      return NextResponse.json({ ok: false, error: 'Missing session_id' }, { status: 400 })
    }

    // Pull a *complete* Session
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent', 'line_items.data.price.product'],
    })

    // ---- Collect metadata you’re setting at checkout time ----
    const meta = (session.metadata ?? {}) as Record<string, string>
    const fileUrl = meta.fileUrl
    const productUid = meta.sku ?? meta.productUid
    const imageId = meta.imageId

    // Validate the minimum we need for a Gelato order
    const missing: string[] = []
    if (!fileUrl) missing.push('fileUrl')
    if (!productUid) missing.push('productUid (or sku)')
    if (!imageId) missing.push('imageId')
    if (missing.length) {
      return NextResponse.json(
        {
          ok: false,
          error: `Missing required metadata: ${missing.join(', ')}`,
          debug: { metadata: meta },
        },
        { status: 400 },
      )
    }

    // ---- Derive shipping/customer from Stripe Session / PaymentIntent ----
    const pi = session.payment_intent as Stripe.PaymentIntent | null
    const cd = session.customer_details
    const addr = cd?.address || (pi?.shipping?.address as Stripe.Address | undefined)
    const name = cd?.name || pi?.shipping?.name || ''
    const { firstName, lastName } = splitName(name)

    const shipping = {
      firstName,
      lastName,
      addressLine1: addr?.line1 || '',
      addressLine2: addr?.line2 || '',
      city: normalizeCity(addr?.city) || '',
      postCode: addr?.postal_code || '',
      state: addr?.state || '',
      country: addr?.country || 'GB',
      email: cd?.email || (session.customer_email ?? ''),
      phone: cd?.phone || '',
    }

    // ---- Build a Gelato order payload (adjust to your catalog needs) ----
    const currency = (session.currency || 'gbp').toUpperCase()
    const gelatoPayload = {
      orderReferenceId: session.id,
      orderType: 'order',
      channel: 'api',
      currency,
      shippingAddress: shipping,
      items: [
        {
          itemReferenceId: 'line-1',
          productUid,
          quantity: 1,
          fileUrl,
          attributes: {
            Orientation: 'ver',
          },
        },
      ],
      shipments: [
        {
          shipmentReferenceId: 'ship-1',
          shipmentMethodUid: process.env.GELATO_SHIPMENT_METHOD_UID || 'STANDARD',
          items: [{ itemReferenceId: 'line-1' }],
        },
      ],
    }

    // ---- DRY RUN if no API key present ----
    if (!GELATO_API_KEY) {
      return NextResponse.json({
        ok: true,
        gelatoOrderId: undefined,
        gelatoStatus: 'dry-run (no GELATO_API_KEY)',
        debug: {
          gelatoBase: GELATO_BASE,
          payload: gelatoPayload,
          stripeSession: {
            id: session.id,
            amount_total: session.amount_total,
            currency: session.currency,
            customer_details: session.customer_details,
            metadata: session.metadata,
          },
        },
      })
    }

    // ---- Call Gelato (server-side only) ----
    const res = await fetch(`${GELATO_BASE}/v4/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': GELATO_API_KEY,
      },
      body: JSON.stringify(gelatoPayload),
    })

    const text = await res.text()

    // Use `unknown`, not `any`, and validate
    let parsed: unknown = null
    try {
      parsed = text ? JSON.parse(text) as unknown : null
    } catch {
      parsed = { raw: text } as unknown
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Gelato order failed: ${res.status}`,
          debug: { gelatoBase: GELATO_BASE, responseText: text, responseJson: parsed },
        },
        { status: 502 },
      )
    }

    // ✅ actually use the type guard
    if (!isGelatoOrderResponse(parsed)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unexpected response from Gelato (missing id/status)',
          debug: { gelatoBase: GELATO_BASE, responseJson: parsed },
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      ok: true,
      gelatoOrderId: parsed.id,
      gelatoStatus: parsed.status,
      debug: {
        gelatoBase: GELATO_BASE,
        response: parsed,
        payload: gelatoPayload,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
