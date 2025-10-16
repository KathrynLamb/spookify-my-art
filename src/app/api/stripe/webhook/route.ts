// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import {
  splitName,
  normalizeCity,
  type GelatoAddress,
  GELATO_ORDER_BASE,
  gelatoHeaders,
} from '@/lib/gelato'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') ?? ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  // If the secret is missing, fail loudly so you notice in logs.
  if (!secret) {
    return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 })
  }
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    // constructEvent accepts string or Buffer
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 })
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

    // Guard – if any required bit is missing, let Stripe retry by returning 500.
    if (!fileUrl || !productUid || !imageId) {
      return NextResponse.json({ error: 'Missing fileUrl/productUid/imageId' }, { status: 500 })
    }

    try {
      // Call Gelato directly
      const res = await fetch(`${GELATO_ORDER_BASE}/orders`, {
        method: 'POST',
        headers: gelatoHeaders(),
        body: JSON.stringify({
          orderReferenceId: session.id,
          orderType: 'order',
          channel: 'api',
          currency: (session.currency ?? 'gbp').toUpperCase(),
          shippingAddress: {
            firstName: addr.firstName,
            lastName: addr.lastName,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2,
            city: addr.city,
            postCode: addr.postCode,
            state: addr.state,
            country: addr.country,
            email: addr.email,
            phone: addr.phone,
          },
          items: [
            {
              itemReferenceId: 'line-1',
              productUid: productUid,
              quantity: 1,
              fileUrl,
              // TODO: map your real attributes (e.g., Orientation) if required by your product
              attributes: { Orientation: 'ver' },
            },
          ],
          shipments: [
            {
              shipmentReferenceId: 'ship-1',
              shipmentMethodUid: process.env.GELATO_SHIPMENT_METHOD_UID || 'STANDARD',
              items: [{ itemReferenceId: 'line-1' }],
            },
          ],
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('[gelato] create failed:', res.status, errorText)
        // Return 500 to let Stripe retry webhook automatically
        return NextResponse.json({ error: 'Gelato order failed' }, { status: 500 })
      }

      const json = await res.json()
      console.log('[gelato] order created', json?.id)

      // If you have KV, persist json.id as gelatoOrderId here.
      // await markGelatoCreated(imageId, { gelatoOrderId: json.id, gelatoStatus: json.status })

    } catch (err) {
      console.error('[webhook] Gelato order error', err)
      return NextResponse.json({ error: 'Gelato exception' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
