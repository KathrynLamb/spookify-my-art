import { FRAMED_POSTER } from '@/lib/products/framed-poster'
import { NextResponse } from 'next/server'

const ENV = process.env.PAYPAL_ENV?.toLowerCase() === 'live' ? 'live' : 'sandbox'
const BASE =
  ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

const CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
const CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET || ''

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error('PayPal auth failed')
  const json = await res.json()
  return json.access_token as string
}

export async function POST(req: Request) {
  try {
    const { orderID, gelatoOrder } = await req.json()
    if (!orderID)
      return NextResponse.json({ error: 'Missing orderID' }, { status: 400 })

    // === 1️⃣ Capture the PayPal payment ===
    const token = await getAccessToken()
    const captureRes = await fetch(`${BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    const paypal = await captureRes.json()
    if (!captureRes.ok) {
      return NextResponse.json(
        { error: paypal?.message || 'PayPal capture failed', details: paypal },
        { status: 500 }
      )
    }

    // === 2️⃣ Prepare and validate Gelato order ===
    let gelato = null
    if (gelatoOrder) {
      const { currency, shippingAddress, size, orientation, frameColor, fileUrl } = gelatoOrder

      if (!fileUrl || !size || !orientation || !frameColor) {
        return NextResponse.json(
          { ok: false, error: 'Missing size/orientation/frameColor/fileUrl' },
          { status: 400 }
        )
      }

      // 🔍 Find the correct product variant in your catalog
      const variant = FRAMED_POSTER.variants.find(
        (v) =>
          v.sizeLabel === size &&
          v.orientation === orientation &&
          v.frameColor === frameColor
      )

      if (!variant) {
        console.error('[Gelato] No variant match for:', { size, orientation, frameColor })
        return NextResponse.json(
          {
            ok: false,
            error: `No Gelato product found for ${size}, ${orientation}, ${frameColor}`,
          },
          { status: 400 }
        )
      }

      const productUid = variant.productUid

      // 🧾 Build Gelato-compliant payload
      const body = {
        orderReferenceId: orderID,
        currency,
        shippingAddress,
        items: [
          {
            itemReferenceId: 'poster1',
            productUid,
            quantity: 1,
            fileUrl,
          },
        ],
        shipments: [
          {
            shipmentReferenceId: 'main',
            shipmentMethodUid: 'STANDARD',
            items: [{ itemReferenceId: 'poster1' }],
          },
        ],
      }

      // === 3️⃣ Place the Gelato order ===
      try {
        const gelatoRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/gelato/place-order`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        )
        gelato = await gelatoRes.json()
      } catch (err) {
        console.error('[PayPal→Gelato] Network or API error', err)
        gelato = { ok: false, error: 'Failed to reach Gelato API' }
      }
    }

    // === 4️⃣ Return combined result ===
    return NextResponse.json({ ok: true, paypal, gelato })
  } catch (err) {
    console.error('[PayPal Capture] Fatal error', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
