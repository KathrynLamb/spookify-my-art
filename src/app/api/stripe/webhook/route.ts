// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type GelatoAddress = {
  name: string
  address1: string
  address2?: string
  city: string
  zip: string
  state?: string
  country: string
  phone?: string
  email?: string
}

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

    // IMPORTANT: pass exact raw bytes to constructEvent
    const rawText = await req.text()
    const rawBody = Buffer.from(rawText, 'utf8')

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret)
    } catch (err) {
      console.error('[stripe] Signature verification failed:', (err as Error).message, {
        sigLen: sig.length,
        rawLen: rawBody.length,
        ctype: req.headers.get('content-type'),
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('[stripe] event', event.type)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // metadata we set when creating the Checkout Session
      const meta = (session.metadata ?? {}) as Record<string, string>
      const fileUrl = meta.fileUrl
      // we store the Gelato productUid in metadata.sku (or productUid)
      const productUid = meta.sku ?? meta.productUid
      const imageId = meta.imageId

      // Map Stripe -> Gelato shipping address
      const cd = session.customer_details
      const addr = cd?.address
      const gelatoAddress: GelatoAddress = {
        name: cd?.name ?? 'Customer',
        address1: addr?.line1 ?? '',
        address2: addr?.line2 ?? undefined,
        city: addr?.city ?? '',
        zip: addr?.postal_code ?? '',
        state: addr?.state ?? undefined,
        country: addr?.country ?? 'GB',
        phone: cd?.phone ?? undefined,
        email: cd?.email ?? session.customer_email ?? undefined,
      }

      if (!fileUrl || !productUid || !imageId) {
        console.error('[stripe] Missing fileUrl/productUid/imageId in metadata; skipping Gelato order.', {
          fileUrl, productUid, imageId,
        })
      } else {
        const base = envBaseUrl()
        const resp = await fetch(`${base}/api/gelato/place-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productUid,                     // Gelato product UID
            fileUrl,                        // http(s) or data: (server route can handle uploading)
            imageId,
            currency: (session.currency ?? 'gbp').toUpperCase(),
            address: gelatoAddress,
            shipmentMethodUid: 'STANDARD',
            attributes: { Orientation: 'ver' }, // optional (explicit portrait)
            externalOrderId: session.id,
          }),
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
