
import { NextResponse } from 'next/server'
import { ORDER_CTX } from '@/app/api/_order-kv';




const ENV = process.env.PAYPAL_ENV?.toLowerCase() === 'live' ? 'live' : 'sandbox'
const BASE =
  ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

    // at top of the file (after BASE):
const APPROVE_BASE =
ENV === 'live'
  ? 'https://www.paypal.com/checkoutnow?token='
  : 'https://www.sandbox.paypal.com/checkoutnow?token=';

const CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID ||
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  ''
const CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET || ''

type CreateReq = {
  amount: number
  currency: 'GBP' | 'USD' | 'EUR'
  title: string
  imageId: string
  fileUrl: string
  sku?: string // 👈 NEW: distinguish print-at-home vs physical
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
      sku,
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

    // 🧩 Branch 1: DIGITAL — Print-at-Home
 // in /api/paypal/create/route.ts (digital branch)
if (sku === 'print-at-home') {
  const value = amount.toFixed(2);

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: imageId || 'spooky-digital',
        description: title || 'Print-at-Home Artwork (digital download)',
        amount: {
          currency_code: currency,
          value,
          breakdown: {
            item_total: { currency_code: currency, value },  // ✅ must match items sum
          },
        },
        items: [
          {
            name: title || 'Print-at-Home Artwork',
            quantity: '1',
            category: 'DIGITAL_GOODS',
            unit_amount: { currency_code: currency, value },
          },
        ],
      },
    ],
    application_context: {
      brand_name: 'Spookify',
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING',  // ✅ digital
      locale: 'en-GB',
      landing_page: 'LOGIN',
    },
  };

  const r = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const j = await r.json();
  if (!r.ok || !j?.id) {
    return NextResponse.json(
      { error: j?.message || 'Unable to create PayPal order', details: j },
      { status: 500 },
    );
  }

    // … inside DIGITAL branch, replace the final return with:
    ORDER_CTX.set(j.id, { fileUrl, imageId });
    return NextResponse.json({
      orderID: j.id,
      approveUrl: `${APPROVE_BASE}${j.id}`,      // 👈 add this
      passthrough: { sku, imageId, fileUrl },
    });
    }

    // 🧩 Branch 2: PHYSICAL — Gelato print (existing flow)
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
        shipping_preference: 'GET_FROM_FILE',
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

    ORDER_CTX.set(j.id, { fileUrl, imageId });
    return NextResponse.json({
      orderID: j.id,
      approveUrl: `${APPROVE_BASE}${j.id}`,        // 👈 add this
      passthrough: { imageId, fileUrl, size, orientation, frameColor },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    )
  }
}
