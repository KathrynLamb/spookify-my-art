// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CheckoutBody = {
  fileUrl?: string
  imageId?: string
  sku?: string            // <-- send a SKU like 'POSTER_M200_50x70'
  title?: string          // optional nice name for line item
  price?: number          // minor units, e.g. 3499 = £34.99
}

function baseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL
  if (envUrl) return envUrl.replace(/\/+$/, '')
  return `http://localhost:${process.env.PORT || 3000}`
}

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, imageId, sku, title, price } = (await req.json()) as CheckoutBody

    if (!fileUrl || !imageId || !sku) {
      return NextResponse.json({ error: 'Missing fileUrl, imageId, or sku' }, { status: 400 })
    }

    if (!Number.isFinite(price)) {
      return NextResponse.json({ error: 'Missing or invalid price (minor units)' }, { status: 400 })
    }

    const lineName = title ?? `Spookified Wall Art – ${sku}`

    const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'gbp',
      customer_creation: 'if_required',
      allow_promotion_codes: true,

      // Collect shipping + offer Standard/Express inline (no saved IDs needed)
      shipping_address_collection: {
        allowed_countries: ['GB','IE','FR','DE','ES','IT','NL','SE','NO','DK','US','CA','AU','NZ'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: 'Standard',
            type: 'fixed_amount',
            fixed_amount: { amount: 499, currency: 'gbp' },
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
        {
          shipping_rate_data: {
            display_name: 'Express',
            type: 'fixed_amount',
            fixed_amount: { amount: 999, currency: 'gbp' },
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 1 },
              maximum: { unit: 'business_day', value: 2 },
            },
          },
        },
      ],

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: price,
            product_data: {
              name: lineName,
              images: [fileUrl],
              // (optional) store some metadata on the product this session creates
              metadata: { imageId, sku, fileUrl },
            },
          },
        },
      ],

      // This metadata is what your Stripe webhook reads to place the Gelato order
      metadata: {
        fileUrl,
        sku,
        imageId,
      },

      success_url: `${baseUrl()}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl()}/upload?cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg || 'Checkout failed' }, { status: 500 })
  }
}
