// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Currency = 'GBP' | 'USD' | 'EUR'
type Body = {
  fileUrl?: string
  imageId?: string
  sku?: string
  title?: string
  price?: number
  priceIsMajor?: boolean
  currency?: Currency
}

const ALLOWED: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  ['GB','IE','FR','DE','ES','IT','NL','SE','NO','DK','US','CA','AU','NZ']

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

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, imageId, sku, title, price, priceIsMajor, currency: reqCur } =
      (await req.json()) as Body

    if (!fileUrl || !imageId || !sku)
      return NextResponse.json({ error: 'Missing fileUrl, imageId, or sku' }, { status: 400 })
    if (typeof price !== 'number' || !Number.isFinite(price))
      return NextResponse.json({ error: 'Missing or invalid price' }, { status: 400 })

    const currency = (reqCur || 'GBP') as Currency
    if (!['GBP','USD','EUR'].includes(currency))
      return NextResponse.json({ error: `Unsupported currency: ${reqCur}` }, { status: 400 })

    const stripeCurrency = currency.toLowerCase()
    const unitAmount = priceIsMajor ? Math.round(price * 100) : Math.round(price)
    const ship = SHIPPING[currency]
    const lineName = title ?? `Spookified Wall Art – ${sku}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      allow_promotion_codes: true,
      customer_creation: 'if_required',
      currency: stripeCurrency,
      shipping_address_collection: { allowed_countries: ALLOWED },
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
              metadata: { imageId, sku, fileUrl },
            },
          },
        },
      ],
      metadata: { fileUrl, imageId, sku, currency },
      success_url: `${baseUrl()}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl()}/upload?cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Checkout failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
