// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SupportedCurrency = 'gbp' | 'usd' | 'eur'

type CheckoutBody = {
  fileUrl?: string
  imageId?: string
  sku?: string                 // your Gelato productUid (we pass it in metadata.sku)
  title?: string               // nice name for the line item
  price?: number               // minor units for the chosen currency (e.g., 2595)
  currency?: string            // 'GBP' | 'USD' | 'EUR' (case-insensitive)
}

function baseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL
  if (envUrl) return envUrl.replace(/\/+$/, '')
  return `http://localhost:${process.env.PORT || 3000}`
}

// Simple per-currency shipping amounts (minor units)
function shippingFor(currency: SupportedCurrency) {
  // Tune these if you like. These are what Stripe displays in Checkout.
  switch (currency) {
    case 'usd':
      return { standard: 699, express: 1499, code: 'usd' as const }
    case 'eur':
      return { standard: 599, express: 1299, code: 'eur' as const }
    case 'gbp':
    default:
      return { standard: 499, express: 999, code: 'gbp' as const }
  }
}

// Lowercases + validates currency, defaults to gbp
function sanitizeCurrency(input?: string): SupportedCurrency {
  const c = (input || '').toLowerCase()
  if (c === 'usd' || c === 'eur' || c === 'gbp') return c
  return 'gbp'
}

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, imageId, sku, title, price, currency } =
      (await req.json()) as CheckoutBody

    if (!fileUrl || !imageId || !sku) {
      return NextResponse.json(
        { error: 'Missing fileUrl, imageId, or sku' },
        { status: 400 },
      )
    }
    if (!Number.isFinite(price)) {
      return NextResponse.json(
        { error: 'Missing or invalid price (minor units)' },
        { status: 400 },
      )
    }

    const curr = sanitizeCurrency(currency)
    const ship = shippingFor(curr)
    const lineName = title ?? `Spookify – ${sku}`

    const session: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        mode: 'payment',
        currency: curr,                       // ← currency user picked on the products page
        customer_creation: 'if_required',
        allow_promotion_codes: true,
        // automatic_tax: { enabled: true },  // optional if you want Stripe tax

        // ✅ Collect a full shipping address at checkout
        shipping_address_collection: {
          allowed_countries: [
            'GB','IE','FR','DE','ES','IT','NL','SE','NO','DK',
            'US','CA','AU','NZ',
          ],
        },

        // Show Standard / Express in the same currency
        shipping_options: [
          {
            shipping_rate_data: {
              display_name: 'Standard',
              type: 'fixed_amount',
              fixed_amount: { amount: ship.standard, currency: ship.code },
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
              fixed_amount: { amount: ship.express, currency: ship.code },
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
              currency: curr,
              unit_amount: price,             // minor units in curr
              product_data: {
                name: lineName,
                images: [fileUrl],
                metadata: { imageId, sku, fileUrl }, // optional extra copy
              },
            },
          },
        ],

        // 🔖 Your webhook reads these to place the Gelato order
        metadata: {
          fileUrl,
          imageId,
          sku,
          currency: curr, // so the webhook can forward to Gelato
        },

        success_url: `${baseUrl()}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl()}/products?canceled=1`,
      })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg || 'Checkout failed' }, { status: 500 })
  }
}
