// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { splitName, normalizeCity, type GelatoAddress } from '@/lib/gelato'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') ?? ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  // Skip quietly if this isn't a real Stripe webhook
  if (!sig || !secret) return NextResponse.json({ ok: true, skipped: 'no-signature' })

  const rawText = await req.text()
  const rawBody = Buffer.from(rawText, 'utf8')

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = (session.metadata ?? {}) as Record<string, string>
    const fileUrl = meta.fileUrl
    const productUid = meta.sku ?? meta.productUid
    const imageId = meta.imageId

    const cd = session.customer_details
    const a = cd?.address
    const { firstName, lastName } = splitName(cd?.name ?? undefined)
    const addr: GelatoAddress = {
      firstName, lastName, name: cd?.name ?? undefined,
      addressLine1: a?.line1 ?? undefined,
      addressLine2: a?.line2 ?? undefined,
      city: normalizeCity(a?.city),
      postCode: a?.postal_code ?? undefined,
      state: a?.state ?? undefined,
      country: a?.country ?? 'GB',
      email: cd?.email ?? session.customer_email ?? undefined,
      phone: cd?.phone ?? undefined,
    }

    try {
      console.log('NOT GOT all the props ==>>', fileUrl, productUid, imageId)
      if (fileUrl && productUid && imageId) {
        console.log('all the props ==>>', fileUrl, productUid, imageId)
        const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/,'')
          || `http://localhost:${process.env.PORT || 3000}`
        const gelatoOrder = await fetch(`${base}/api/gelato/place-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderReferenceId: session.id,
            orderType: 'order',
            currency: (session.currency ?? 'gbp').toUpperCase(),
            channel: 'api',
            shippingAddress: addr,
            items: [
              { itemReferenceId: 'line-1', productUid, quantity: 1, fileUrl, attributes: { Orientation: 'ver' } },
            ],
            shipments: [
              { shipmentReferenceId: 'ship-1', shipmentMethodUid: 'STANDARD', items: [{ itemReferenceId: 'line-1' }] },
            ],

          }
        
          ),

        })
        console.log("Gelate order", gelatoOrder)
        // .catch(() => {
        //   console.log('got caught')
        // })
      }
    } catch (e) {
      console.error('[webhook] Gelato order failed', e)
      // optional: return 500 to let Stripe retry
    }
  }

  return NextResponse.json({ received: true })
}
