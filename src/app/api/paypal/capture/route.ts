import { FRAMED_POSTER } from '@/lib/products/framed-poster'
import { NextResponse } from 'next/server'

const ENV = process.env.PAYPAL_ENV?.toLowerCase() === 'live' ? 'live' : 'sandbox'
const BASE =
  ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

const CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID ||
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  ''
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
    const captureRes = await fetch(
      `${BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    const paypal = await captureRes.json()
    if (!captureRes.ok) {
      return NextResponse.json(
        { error: paypal?.message || 'PayPal capture failed', details: paypal },
        { status: 500 }
      )
    }

    // === 2️⃣ Extract buyer shipping address from PayPal ===
    const shipping = paypal?.purchase_units?.[0]?.shipping
    const address = shipping?.address || {}
    const name = shipping?.name?.full_name?.split(' ') || []
    const [first_name, ...lastParts] = name
    const last_name = lastParts.join(' ')

    const gelatoAddress = {
      first_name: first_name || 'Unknown',
      last_name: last_name || '',
      address_line_1: address.address_line_1 || address.line1 || '',
      city: address.admin_area_2 || '',
      postal_code: address.postal_code || '',
      country_code: address.country_code || '',
      email: paypal?.payer?.email_address || '',
    }

    // === 3️⃣ Prepare Gelato order ===
    let gelato = null
    if (gelatoOrder) {
      const { currency, size, orientation, frameColor, fileUrl } = gelatoOrder

      if (!fileUrl || !size || !orientation || !frameColor) {
        return NextResponse.json(
          { ok: false, error: 'Missing size/orientation/frameColor/fileUrl' },
          { status: 400 }
        )
      }

      const variant = FRAMED_POSTER.variants.find(
        (v) =>
          v.sizeLabel === size &&
          v.orientation === orientation &&
          v.frameColor === frameColor
      )

      if (!variant) {
        console.error('[Gelato] No variant match for:', {
          size,
          orientation,
          frameColor,
        })
        return NextResponse.json(
          {
            ok: false,
            error: `No Gelato product found for ${size}, ${orientation}, ${frameColor}`,
          },
          { status: 400 }
        )
      }

      const productUid = variant.productUid

      const gelatoBody = {
        orderReferenceId: orderID,
        currency,
        shippingAddress: gelatoAddress,
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

      // === 4️⃣ Place the Gelato order ===
      try {
        const gelatoRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/gelato/place-order`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gelatoBody),
          }
        )
        gelato = await gelatoRes.json()
      } catch (err) {
        console.error('[PayPal→Gelato] Network or API error', err)
        gelato = { ok: false, error: 'Failed to reach Gelato API' }
      }
    }

    // === 5️⃣ Return combined result ===
    return NextResponse.json({ ok: true, paypal, gelato })
  } catch (err) {
    console.error('[PayPal Capture] Fatal error', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
