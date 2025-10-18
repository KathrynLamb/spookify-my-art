import { NextResponse } from 'next/server'

const ENV = process.env.PAYPAL_ENV?.toLowerCase() === 'live' ? 'live' : 'sandbox'
const BASE = ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET || ''

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  if (!r.ok) throw new Error('PayPal auth failed')
  const j = await r.json()
  return j.access_token as string
}

export async function POST(req: Request) {
  try {
    const { orderID, gelatoOrder } = await req.json()
    if (!orderID) return NextResponse.json({ error: 'Missing orderID' }, { status: 400 })

    // 1️⃣ Capture PayPal order
    const token = await getAccessToken()
    const r = await fetch(`${BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    const paypal = await r.json()
    if (!r.ok) return NextResponse.json({ error: paypal?.message || 'Capture failed', details: paypal }, { status: 500 })

    // 2️⃣ If PayPal success → forward to Gelato
    let gelato = null
    if (gelatoOrder) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/gelato/place-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gelatoOrder),
        })
        gelato = await res.json()
      } catch (e) {
        console.error('[PayPal→Gelato] Failed to create order', e)
      }
    }

    return NextResponse.json({ ok: true, paypal, gelato })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
