import { findProductUid } from '@/lib/products/index'
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
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('PayPal auth failed')
  const json = await res.json()
  return json.access_token as string
}

// -----------------------------
// Types
// -----------------------------
type CaptureInput = {
  orderID: string
  gelatoOrder?: {
    product: 'framed-poster' | 'poster' | 'print-at-home'
    currency: 'GBP' | 'USD' | 'EUR'
    size: string
    orientation: 'Vertical' | 'Horizontal'
    frameColor?: 'Black' | 'White' | 'Wood' | 'Dark wood'
    fileUrl: string
  }
}

// -----------------------------
// Main Handler
// -----------------------------
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CaptureInput
    const { orderID, gelatoOrder } = body

    if (!orderID) {
      console.error('❌ Missing orderID in capture body', body)
      return NextResponse.json({ error: 'Missing orderID' }, { status: 400 })
    }

    // 1️⃣ Capture the PayPal payment
    const token = await getAccessToken()
    const captureRes = await fetch(`${BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const paypal = await captureRes.json()
    if (!captureRes.ok) {
      return NextResponse.json(
        { error: paypal?.message || 'PayPal capture failed', details: paypal },
        { status: 500 },
      )
    }

    // 2️⃣ Extract buyer shipping info (if available)
    const pu = paypal?.purchase_units?.[0] ?? {}
    const shipping = pu?.shipping ?? {}
    const addr = shipping?.address ?? {}
    const full = (shipping?.name?.full_name as string | undefined) || ''
    const [first, ...rest] = full.split(/\s+/).filter(Boolean)
    const last = rest.join(' ')

    const shippingAddress = {
      firstName: first || 'Customer',
      lastName: last || '',
      addressLine1: addr.address_line_1 || addr.line1 || '',
      addressLine2: addr.address_line_2 || '',
      city: addr.admin_area_2 || '',
      postCode: addr.postal_code || '',
      country: addr.country_code || 'GB',
      email: paypal?.payer?.email_address || '',
    }

    // 3️⃣ Handle order fulfillment
    let gelato: unknown = null

    if (gelatoOrder) {
      const { product, currency, size, orientation, frameColor, fileUrl } = gelatoOrder

      // 🧩 Case 1: DIGITAL PRINT-AT-HOME
      if (product === 'print-at-home') {
        console.log('💾 Digital order — skipping Gelato placement')
        return NextResponse.json({
          ok: true,
          paypal,
          gelato: { ok: true, digital: true, note: 'No Gelato fulfillment needed' },
        })
      }

      // 🧩 Case 2: PHYSICAL PRODUCT — needs Gelato
      const productUid = findProductUid(
        product === 'poster'
          ? { product, size, orientation }
          : { product, size, orientation, frameColor: frameColor! },
      )

      if (!productUid) {
        console.error('❌ No product UID match', { product, size, orientation, frameColor })
        return NextResponse.json(
          {
            ok: false,
            error: `No catalog variant for product=${product}, size=${size}, orientation=${orientation}${
              product === 'framed-poster' ? `, frameColor=${frameColor}` : ''
            }`,
          },
          { status: 400 },
        )
      }

      // Build the Gelato order payload
      const gelatoPayload = {
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

      // Determine the correct base URL for internal call
      const reqUrl = new URL(req.url)
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
        reqUrl.origin ||
        'http://localhost:3000'

      // Call Gelato placement route
      const gRes = await fetch(`${baseUrl}/api/gelato/place-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gelatoPayload),
        cache: 'no-store',
      })
      gelato = await gRes.json()
    }

    // 4️⃣ Return unified result
    return NextResponse.json({ ok: true, paypal, gelato })
  } catch (err) {
    console.error('[PayPal Capture] Fatal error', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Unexpected error' },
      { status: 500 },
    )
  }
}
