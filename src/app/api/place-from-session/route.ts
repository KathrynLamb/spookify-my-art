// src/app/api/gelato/place-from-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { GELATO_ORDER_BASE, gelatoHeaders, splitName, normalizeCity } from '@/lib/gelato'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = { session_id?: string }

export async function POST(req: NextRequest) {
  try {
    const { session_id } = (await req.json()) as Body
    if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

    const session = await stripe.checkout.sessions.retrieve(session_id)

    const meta = (session.metadata ?? {}) as Record<string, string>
    const fileUrl = meta.fileUrl
    const productUid = meta.sku ?? meta.productUid
    const imageId = meta.imageId
    if (!fileUrl || !productUid || !imageId) {
      return NextResponse.json({ error: 'Missing fileUrl/productUid/imageId in session metadata' }, { status: 400 })
    }

    const cd = session.customer_details
    const a = cd?.address
    const { firstName, lastName } = splitName(cd?.name ?? undefined)
    const shipping = {
      firstName,
      lastName,
      addressLine1: a?.line1 ?? '',
      addressLine2: a?.line2 ?? '',
      city: normalizeCity(a?.city) ?? '',
      postCode: a?.postal_code ?? '',
      state: a?.state ?? '',
      country: a?.country ?? 'GB',
      email: cd?.email ?? session.customer_email ?? '',
      phone: cd?.phone ?? '',
    }

    const res = await fetch(`${GELATO_ORDER_BASE}/orders`, {
      method: 'POST',
      headers: gelatoHeaders(),
      body: JSON.stringify({
        orderReferenceId: session.id,
        orderType: 'order',
        channel: 'api',
        currency: (session.currency ?? 'gbp').toUpperCase(),
        shippingAddress: shipping,
        items: [
          { itemReferenceId: 'line-1', productUid, quantity: 1, fileUrl, attributes: { Orientation: 'ver' } },
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
      const txt = await res.text()
      return NextResponse.json({ error: `Gelato order failed: ${res.status} ${txt}` }, { status: 502 })
    }

    const order = await res.json() as { id?: string; status?: string }
    return NextResponse.json({ ok: true, gelatoOrderId: order.id, gelatoStatus: order.status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
