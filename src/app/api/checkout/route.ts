// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Currency = 'GBP' | 'USD' | 'EUR'

type CheckoutBody = {
  fileUrl?: string
  imageId?: string
  sku?: string                 // Gelato productUid; stored as metadata.sku
  title?: string               // optional nice name for line item
  price?: number               // minor units preferred; or major if priceIsMajor=true
  priceIsMajor?: boolean       // if true, treat price as major units and convert
  currency?: Currency          // client-selected currency (defaults to GBP)
}

// Allowed countries to collect shipping for
const ALLOWED: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] = [
  'GB','IE','FR','DE','ES','IT','NL','SE','NO','DK','US','CA','AU','NZ'
]

// Per-currency shipping rates (minor units)
const SHIPPING: Record<Currency, { standard: number; express: number }> = {
  GBP: { standard: 449, express: 999 },
  USD: { standard: 599, express: 1499 },
  EUR: { standard: 549, express: 1299 },
}

function baseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL
  if (envUrl) return envUrl.replace(/\/+$/, '')
  return `http://localhost:${process.env.PORT || 3000}`
}

function toMinor(n: number) {
  // Round to nearest cent/penny — protects against 19.999999 issues.
  return Math.round(n * 100)
}

// Map our uppercase Currency to Stripe’s lowercase currency union

function toStripeCurrency(c: Currency): string {
  return c.toLowerCase()
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody
    const { fileUrl, imageId, sku, title, price, priceIsMajor, currency: reqCurrency } = body

    // Validate required fields
    if (!fileUrl || !imageId || !sku) {
      return NextResponse.json({ error: 'Missing fileUrl, imageId, or sku' }, { status: 400 })
    }
    if (typeof price !== 'number' || !Number.isFinite(price)) {
      return NextResponse.json({ error: 'Missing or invalid price' }, { status: 400 })
    }

    // Currency (default GBP)
    const currency = (reqCurrency || 'GBP') as Currency
    if (!['GBP', 'USD', 'EUR'].includes(currency)) {
      return NextResponse.json({ error: `Unsupported currency: ${reqCurrency}` }, { status: 400 })
    }
    const stripeCurrency = toStripeCurrency(currency)

    // Normalize price → minor units
    const unitAmount = priceIsMajor ? toMinor(price) : Math.round(price)

    // Shipping table
    const ship = SHIPPING[currency]

    const lineName = title ?? `Spookified Wall Art – ${sku}`

    const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_creation: 'if_required',
      allow_promotion_codes: true,

      // Currency for the session & line items
      currency: stripeCurrency,

      // Collect a full shipping address
      shipping_address_collection: {
        allowed_countries: ALLOWED,
      },

      // Inlined shipping options in the same currency
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: 'Standard',
            type: 'fixed_amount',
            fixed_amount: { amount: ship.standard, currency: stripeCurrency },
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
            fixed_amount: { amount: ship.express, currency: stripeCurrency },
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
            currency: stripeCurrency,
            unit_amount: unitAmount,
            product_data: {
              name: lineName,
              images: [fileUrl],
              metadata: { imageId, sku, fileUrl }, // optional copy
            },
          },
        },
      ],

      // Your webhook reads these to place the Gelato order
      metadata: {
        fileUrl,
        imageId,
        sku,
        currency, // keep original uppercase for your webhook if you prefer
      },

      success_url: `${baseUrl()}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl()}/upload?cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[checkout] error', msg)
    return NextResponse.json({ error: msg || 'Checkout failed' }, { status: 500 })
  }
}
