// // // src/app/api/checkout/route.ts
// // import { NextRequest, NextResponse } from 'next/server'
// // import { stripe } from '@/lib/stripe'
// // import type Stripe from 'stripe'

// // export const runtime = 'nodejs'
// // export const dynamic = 'force-dynamic'

// // type SupportedCurrency = 'gbp' | 'usd' | 'eur'

// // type CheckoutBody = {
// //   fileUrl?: string
// //   imageId?: string
// //   sku?: string                 // your Gelato productUid (we pass it in metadata.sku)
// //   title?: string               // nice name for the line item
// //   price?: number               // minor units for the chosen currency (e.g., 2595)
// //   currency?: string            // 'GBP' | 'USD' | 'EUR' (case-insensitive)
// // }

// // function baseUrl() {
// //   const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL
// //   if (envUrl) return envUrl.replace(/\/+$/, '')
// //   return `http://localhost:${process.env.PORT || 3000}`
// // }

// // // Simple per-currency shipping amounts (minor units)
// // function shippingFor(currency: SupportedCurrency) {
// //   // Tune these if you like. These are what Stripe displays in Checkout.
// //   switch (currency) {
// //     case 'usd':
// //       return { standard: 699, express: 1499, code: 'usd' as const }
// //     case 'eur':
// //       return { standard: 599, express: 1299, code: 'eur' as const }
// //     case 'gbp':
// //     default:
// //       return { standard: 499, express: 999, code: 'gbp' as const }
// //   }
// // }

// // // Lowercases + validates currency, defaults to gbp
// // function sanitizeCurrency(input?: string): SupportedCurrency {
// //   const c = (input || '').toLowerCase()
// //   if (c === 'usd' || c === 'eur' || c === 'gbp') return c
// //   return 'gbp'
// // }

// // export async function POST(req: NextRequest) {
// //   try {
// //     const { fileUrl, imageId, sku, title, price, currency } =
// //       (await req.json()) as CheckoutBody

// //     if (!fileUrl || !imageId || !sku) {
// //       return NextResponse.json(
// //         { error: 'Missing fileUrl, imageId, or sku' },
// //         { status: 400 },
// //       )
// //     }
// //     if (!Number.isFinite(price)) {
// //       return NextResponse.json(
// //         { error: 'Missing or invalid price (minor units)' },
// //         { status: 400 },
// //       )
// //     }

// //     const curr = sanitizeCurrency(currency)
// //     const ship = shippingFor(curr)
// //     const lineName = title ?? `Spookify – ${sku}`

// //     const session: Stripe.Checkout.Session =
// //       await stripe.checkout.sessions.create({
// //         mode: 'payment',
// //         currency: curr,                       // ← currency user picked on the products page
// //         customer_creation: 'if_required',
// //         allow_promotion_codes: true,
// //         // automatic_tax: { enabled: true },  // optional if you want Stripe tax

// //         // ✅ Collect a full shipping address at checkout
// //         shipping_address_collection: {
// //           allowed_countries: [
// //             'GB','IE','FR','DE','ES','IT','NL','SE','NO','DK',
// //             'US','CA','AU','NZ',
// //           ],
// //         },

// //         // Show Standard / Express in the same currency
// //         shipping_options: [
// //           {
// //             shipping_rate_data: {
// //               display_name: 'Standard',
// //               type: 'fixed_amount',
// //               fixed_amount: { amount: ship.standard, currency: ship.code },
// //               delivery_estimate: {
// //                 minimum: { unit: 'business_day', value: 3 },
// //                 maximum: { unit: 'business_day', value: 7 },
// //               },
// //             },
// //           },
// //           {
// //             shipping_rate_data: {
// //               display_name: 'Express',
// //               type: 'fixed_amount',
// //               fixed_amount: { amount: ship.express, currency: ship.code },
// //               delivery_estimate: {
// //                 minimum: { unit: 'business_day', value: 1 },
// //                 maximum: { unit: 'business_day', value: 2 },
// //               },
// //             },
// //           },
// //         ],

// //         line_items: [
// //           {
// //             quantity: 1,
// //             price_data: {
// //               currency: curr,
// //               unit_amount: price,             // minor units in curr
// //               product_data: {
// //                 name: lineName,
// //                 images: [fileUrl],
// //                 metadata: { imageId, sku, fileUrl }, // optional extra copy
// //               },
// //             },
// //           },
// //         ],

// //         // 🔖 Your webhook reads these to place the Gelato order
// //         metadata: {
// //           fileUrl,
// //           imageId,
// //           sku,
// //           currency: curr, // so the webhook can forward to Gelato
// //         },

// //         success_url: `${baseUrl()}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
// //         cancel_url: `${baseUrl()}/products?canceled=1`,
// //       })

// //     return NextResponse.json({ url: session.url })
// //   } catch (err: unknown) {
// //     const msg = err instanceof Error ? err.message : String(err)
// //     return NextResponse.json({ error: msg || 'Checkout failed' }, { status: 500 })
// //   }
// // }
// // src/app/api/checkout/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { stripe } from '@/lib/stripe'
// import type Stripe from 'stripe'

// export const runtime = 'nodejs'
// export const dynamic = 'force-dynamic'

// type Currency = 'gbp' | 'usd' | 'eur'
// type CheckoutBody = {
//   fileUrl?: string
//   imageId?: string
//   sku?: string              // Gelato productUid
//   title?: string
//   price?: number            // minor units
//   currency?: 'GBP'|'USD'|'EUR'
// }

// function baseUrl() {
//   const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL
//   if (envUrl) return envUrl.replace(/\/+$/, '')
//   return `http://localhost:${process.env.PORT || 3000}`
// }

// const SHIP_RATES: Record<Currency, { standard: number; express: number }> = {
//   gbp: { standard: 499, express: 999 },
//   usd: { standard: 599, express: 1499 },
//   eur: { standard: 599, express: 1299 },
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { fileUrl, imageId, sku, title, price, currency } = (await req.json()) as CheckoutBody

//     if (!fileUrl || !imageId || !sku) {
//       return NextResponse.json({ error: 'Missing fileUrl, imageId, or sku' }, { status: 400 })
//     }
//     if (!Number.isFinite(price)) {
//       return NextResponse.json({ error: 'Missing or invalid price (minor units)' }, { status: 400 })
//     }

//     const cur: Currency = (currency || 'GBP').toLowerCase() as Currency
//     const ship = SHIP_RATES[cur] ?? SHIP_RATES.gbp
//     const lineName = title ?? `Wall Art – ${sku}`

//     const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
//       mode: 'payment',
//       currency: cur,
//       customer_creation: 'if_required',
//       allow_promotion_codes: true,

//       shipping_address_collection: {
//         allowed_countries: ['GB','IE','FR','DE','ES','IT','NL','SE','NO','DK','US','CA','AU','NZ'],
//       },
//       shipping_options: [
//         {
//           shipping_rate_data: {
//             display_name: 'Standard',
//             type: 'fixed_amount',
//             fixed_amount: { amount: ship.standard, currency: cur },
//             delivery_estimate: {
//               minimum: { unit: 'business_day', value: 3 },
//               maximum: { unit: 'business_day', value: 7 },
//             },
//           },
//         },
//         {
//           shipping_rate_data: {
//             display_name: 'Express',
//             type: 'fixed_amount',
//             fixed_amount: { amount: ship.express, currency: cur },
//             delivery_estimate: {
//               minimum: { unit: 'business_day', value: 1 },
//               maximum: { unit: 'business_day', value: 2 },
//             },
//           },
//         },
//       ],

//       line_items: [
//         {
//           quantity: 1,
//           price_data: {
//             currency: cur,
//             unit_amount: price,
//             product_data: {
//               name: lineName,
//               images: [fileUrl],
//               metadata: { imageId, sku, fileUrl },
//             },
//           },
//         },
//       ],

//       metadata: { fileUrl, sku, imageId },

//       success_url: `${baseUrl()}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${baseUrl()}/upload?cancelled=1`,
//     })

//     return NextResponse.json({ url: session.url })
//   } catch (err: unknown) {
//     const msg = err instanceof Error ? err.message : String(err)
//     return NextResponse.json({ error: msg || 'Checkout failed' }, { status: 500 })
//   }
// }
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
  price?: number               // can be minor units (preferred) OR major units (see priceIsMajor)
  priceIsMajor?: boolean       // if true, treat price as major units and convert
  currency?: Currency          // required on the client, but we’ll default to GBP if missing
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody
    const { fileUrl, imageId, sku, title, price, priceIsMajor, currency: reqCurrency } = body

    // Validate presence
    if (!fileUrl || !imageId || !sku) {
      return NextResponse.json({ error: 'Missing fileUrl, imageId, or sku' }, { status: 400 })
    }
    if (!Number.isFinite(price)) {
      return NextResponse.json({ error: 'Missing or invalid price' }, { status: 400 })
    }

    // Currency (default GBP for safety)
    const currency = (reqCurrency || 'GBP') as Currency
    if (!['GBP', 'USD', 'EUR'].includes(currency)) {
      return NextResponse.json({ error: `Unsupported currency: ${reqCurrency}` }, { status: 400 })
    }

    // Normalize price → minor units
    const unitAmount = priceIsMajor ? toMinor(price!) : Math.round(price!)

    // Shipping table
    const ship = SHIPPING[currency]

    const lineName = title ?? `Spookified Wall Art – ${sku}`

    const session: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_creation: 'if_required',
        allow_promotion_codes: true,
        currency: currency.toLowerCase() as Stripe.Checkout.SessionCreateParams.Currency,

        // Collect shipping details at checkout
        shipping_address_collection: {
          allowed_countries: ALLOWED,
        },

        // Inline shipping options (localized by currency)
        shipping_options: [
          {
            shipping_rate_data: {
              display_name: 'Standard',
              type: 'fixed_amount',
              fixed_amount: { amount: ship.standard, currency: currency.toLowerCase() as any },
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
              fixed_amount: { amount: ship.express, currency: currency.toLowerCase() as any },
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 1 },
                maximum: { unit: 'business_day', value: 2 },
              },
            },
          },
        ],

        // The product this customer is buying
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: currency.toLowerCase() as any,
              unit_amount: unitAmount,
              product_data: {
                name: lineName,
                images: [fileUrl],
                metadata: { imageId, sku, fileUrl }, // handy if you ever inspect the product
              },
            },
          },
        ],

        // Critical: metadata your Stripe webhook needs to place the Gelato order
        metadata: {
          fileUrl,
          imageId,
          sku,                  // Gelato productUid
          currency,             // for your webhook → Gelato order currency
          // Add anything else you want to see on the webhook here
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

