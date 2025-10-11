// // src/app/api/stripe/webhook/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { stripe } from '@/lib/stripe'
// import type Stripe from 'stripe'

// export const runtime = 'nodejs'
// export const dynamic = 'force-dynamic'

// function envBaseUrl(): string {
//   const envUrl = process.env.NEXT_PUBLIC_BASE_URL
//   if (envUrl) return envUrl.replace(/\/+$/, '')
//   const vercel = process.env.VERCEL_URL
//   if (vercel) return vercel.startsWith('http') ? vercel : `https://${vercel}`
//   return `http://localhost:${process.env.PORT || 3000}`
// }

// function splitName(full?: string): { firstName?: string; lastName?: string } {
//   if (!full) return {}
//   const parts = full.trim().split(/\s+/)
//   if (parts.length === 1) return { firstName: parts[0] }
//   return { firstName: parts.slice(0, -1).join(' '), lastName: parts.slice(-1).join(' ') }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const sig = req.headers.get('stripe-signature') ?? ''
//     const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
//     if (!secret) {
//       console.warn('[stripe] Missing STRIPE_WEBHOOK_SECRET; cannot verify signatures.')
//       return NextResponse.json({ ok: true, skipped: 'no-secret' })
//     }

//     // IMPORTANT: pass exact raw bytes to constructEvent
//     const rawText = await req.text()
//     const rawBody = Buffer.from(rawText, 'utf8')

//     let event: Stripe.Event
//     try {
//       event = stripe.webhooks.constructEvent(rawBody, sig, secret)
//     } catch (err) {
//       console.error('[stripe] Signature verification failed:', (err as Error).message, {
//         sigLen: sig.length,
//         rawLen: rawBody.length,
//         ctype: req.headers.get('content-type'),
//       })
//       return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
//     }

//     console.log('[stripe] event', event.type)

//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object as Stripe.Checkout.Session

//       // Metadata we set when creating the Checkout Session
//       const meta = (session.metadata ?? {}) as Record<string, string>
//       const fileUrl = meta.fileUrl
//       // We store the Gelato productUid in metadata.sku (or productUid)
//       const productUid = meta.sku ?? meta.productUid
//       const imageId = meta.imageId
//       const orientationMeta = meta.orientation // optional, if you pass it

//       // Map Stripe -> Gelato shipping address
//       const cd = session.customer_details
//       const addr = cd?.address

//       console.log('CD', cd)
//       console.log('addr', addr)

//       const { firstName, lastName } = splitName(cd?.name ?? undefined)
//       // Stripe sometimes returns "Town, District" in city; flatten commas
//       const city = (addr?.city ?? '').replace(/\s*,\s*/g, ' ').trim() || undefined

//       // Gelato expects these exact keys
//       const gelatoAddress = {
//         firstName,
//         lastName,
//         name: cd?.name ?? undefined,

//         addressLine1: addr?.line1 ?? undefined,
//         addressLine2: addr?.line2 ?? undefined,
//         city,
//         postCode: addr?.postal_code ?? undefined,
//         state: addr?.state ?? undefined,
//         country: addr?.country ?? 'GB',

//         email: cd?.email ?? session.customer_email ?? undefined,
//         phone: cd?.phone ?? undefined,
//       }

//       console.log('gelatoAddress', gelatoAddress)

//       if (!fileUrl || !productUid || !imageId) {
//         console.error('[stripe] Missing fileUrl/productUid/imageId in metadata; skipping Gelato order.', {
//           fileUrl, productUid, imageId,
//         })
//       } else {
//         const base = envBaseUrl()
//         const resp = await fetch(`${base}/api/gelato/place-order`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             productUid,                     // Gelato product UID
//             fileUrl,                        // http(s) or data: (server route can upload)
//             imageId,
//             currency: (session.currency ?? 'gbp').toUpperCase(),
//             shippingAddress: gelatoAddress, // << correct key + field names
//             shipmentMethodUid: 'STANDARD',
//             attributes: {
//               Orientation: orientationMeta ?? 'ver', // optional
//             },
//             externalOrderId: session.id,
//           }),
//         })

//         const j = await resp.json().catch(() => ({}))
//         console.log('[gelato] response', resp.status, j)
//         if (!resp.ok) console.error('[gelato] order failed', resp.status, j)
//       }
//     }

//     return NextResponse.json({ received: true })
//   } catch (err) {
//     console.error('[stripe] webhook error', err)
//     return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
//   }
// }
// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { splitName, normalizeCity, type GelatoAddress } from '@/lib/gelato'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function envBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (envUrl) return envUrl.replace(/\/+$/, '')
  const vercel = process.env.VERCEL_URL
  if (vercel) return vercel.startsWith('http') ? vercel : `https://${vercel}`
  return `http://localhost:${process.env.PORT || 3000}`
}

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get('stripe-signature') ?? ''
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
    if (!secret) {
      console.warn('[stripe] Missing STRIPE_WEBHOOK_SECRET; cannot verify signatures.')
      return NextResponse.json({ ok: true, skipped: 'no-secret' })
    }

    const rawText = await req.text()
    const rawBody = Buffer.from(rawText, 'utf8')

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret)
    } catch (err) {
      console.error('[stripe] Signature verification failed:', (err as Error).message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('[stripe] event', event.type)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const meta = (session.metadata ?? {}) as Record<string, string>
      const fileUrl = meta.fileUrl
      const productUid = meta.sku ?? meta.productUid
      const imageId = meta.imageId

      const cd = session.customer_details
      const sAddr = cd?.address
      const { firstName, lastName } = splitName(cd?.name ?? undefined)
      const gelatoAddress: GelatoAddress = {
        firstName,
        lastName,
        name: cd?.name ?? undefined,
        addressLine1: sAddr?.line1 ?? undefined,
        addressLine2: sAddr?.line2 ?? undefined,
        city: normalizeCity(sAddr?.city),
        postCode: sAddr?.postal_code ?? undefined,
        state: sAddr?.state ?? undefined,
        country: sAddr?.country ?? 'GB',
        email: cd?.email ?? session.customer_email ?? undefined,
        phone: cd?.phone ?? undefined,
      }

      console.log('[stripe] mapped gelato address', gelatoAddress)

      if (!fileUrl || !productUid || !imageId) {
        console.error('[stripe] Missing fileUrl/productUid/imageId; skip Gelato.', { fileUrl, productUid, imageId })
      } else {
        const base = envBaseUrl()
        const payload = {
          orderReferenceId: session.id,
          orderType: 'order',
          currency: (session.currency ?? 'gbp').toUpperCase(),
          channel: 'api',
          shippingAddress: gelatoAddress,
          items: [
            {
              itemReferenceId: 'line-1',
              productUid,
              quantity: 1,
              fileUrl,
              attributes: { Orientation: 'ver' }, // adjust per selection if you track it
            },
          ],
          shipments: [
            {
              shipmentReferenceId: 'ship-1',
              shipmentMethodUid: 'STANDARD',
              items: [{ itemReferenceId: 'line-1' }],
            },
          ],
        }

        console.log('[Gelato] payload', JSON.stringify(payload, null, 2))

        const resp = await fetch(`${base}/api/gelato/place-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const j = await resp.json().catch(() => ({}))
        console.log('[gelato] response', resp.status, j)
        if (!resp.ok) console.error('[gelato] order failed', resp.status, j)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[stripe] webhook error', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
