// src/app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SessionInfo = {
  id: string
  status: string
  created: number
  currency: string
  amount_total?: number
  customer_name?: string
  email?: string
  title?: string
  fileUrl?: string
  shipping?: {
    name?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
  }
  gelatoOrderId?: string
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const session = await stripe.checkout.sessions.retrieve(id, {
      expand: ['line_items.data.price.product', 'customer_details', 'shipping_details'],
    })

    // First line item (we only ever sell one)
    const line: Stripe.LineItem | undefined = session.line_items?.data?.[0]
    const price: Stripe.Price | undefined =
      (line?.price as Stripe.Price | undefined)

    // price.product can be a string or a Product
    const product: Stripe.Product | undefined =
      typeof price?.product === 'object' && price?.product !== null
        ? (price.product as Stripe.Product)
        : undefined

    const productImage = product?.images?.[0]
    const productName =
      product?.name || line?.description || 'Spookified Wall Art'

    // Metadata keys are strings on Stripe
    const fileFromMetadata: string | undefined =
      session.metadata?.fileUrl || undefined
    const gelatoOrderId: string | undefined =
      session.metadata?.gelatoOrderId || undefined
      const cd = session.customer_details;

      const info: SessionInfo = {
        id: session.id,
        status: (session.payment_status || session.status || 'created') as string,
        created: session.created,
        currency: (session.currency || 'gbp').toUpperCase(),
        amount_total: typeof session.amount_total === 'number' ? session.amount_total : undefined,
      
        customer_name: cd?.name || undefined,
        email: cd?.email || session.customer_email || undefined,
      
        title: productName,
        fileUrl: fileFromMetadata || productImage || undefined,
      
        // ✅ Build from customer_details.address (typed)
        shipping: {
          name: cd?.name || undefined,
          address: {
            line1: cd?.address?.line1 || undefined,
            line2: cd?.address?.line2 || undefined,
            city: cd?.address?.city || undefined,
            state: cd?.address?.state || undefined,
            postal_code: cd?.address?.postal_code || undefined,
            country: cd?.address?.country || undefined,
          },
        },
      
        gelatoOrderId,
      }
      

    return NextResponse.json(info)
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Failed to load session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
