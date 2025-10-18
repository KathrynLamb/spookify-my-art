// src/app/api/paypal/create/route.ts
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

type CreateReq = {
  amount: number
  currency: 'GBP' | 'USD' | 'EUR'
  title: string
  // we forward these through the flow for your thank-you + gelato capture
  imageId: string
  fileUrl: string
  size?: string
  orientation?: 'Vertical' | 'Horizontal'
  frameColor?: 'Black' | 'White' | 'Wood' | 'Dark wood'
}

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  if (!r.ok) throw new Error('PayPal auth failed')
  const j = await r.json()
  return j.access_token as string
}

export async function POST(req: Request) {
  try {
    const {
      amount,
      currency,
      title,
      imageId,
      fileUrl,
      size,
      orientation,
      frameColor,
    } = (await req.json()) as CreateReq

    if (!amount || !currency) {
      return NextResponse.json(
        { error: 'Missing amount/currency' },
        { status: 400 },
      )
    }

    const token = await getAccessToken()

    // IMPORTANT: shipping_preference = GET_FROM_FILE
    // This tells PayPal to collect/confirm shipping from the buyer’s wallet.
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: imageId || 'spooky-art',
          description: title || 'Custom Printed Wall Art',
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'Spookify',
        user_action: 'PAY_NOW',
        shipping_preference: 'GET_FROM_FILE', // <— make PayPal show/select shipping
        locale: 'en-GB',
        landing_page: 'LOGIN',
      },
    }

    const r = await fetch(`${BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    const j = await r.json()
    if (!r.ok || !j?.id) {
      return NextResponse.json(
        { error: j?.message || 'Unable to create PayPal order', details: j },
        { status: 500 },
      )
    }

    return NextResponse.json({
      orderID: j.id,
      // echo through for your client to forward to /capture later
      passthrough: { imageId, fileUrl, size, orientation, frameColor },
    })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    )
  }
}
