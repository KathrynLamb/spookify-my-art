import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CheckoutBody = {
  fileUrl?: string
  imageId?: string
  size?: string
  price?: number // minor units
}

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, imageId, size = '50x70', price = 3499 } = (await req.json()) as CheckoutBody
    if (!fileUrl || !imageId) {
      return NextResponse.json({ error: 'Missing fileUrl or imageId' }, { status: 400 })
    }

    const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'gbp',
      customer_creation: 'if_required',
      shipping_address_collection: {
        allowed_countries: ['GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'US', 'CA', 'AU', 'NZ'],
      },
      shipping_options: [
        { shipping_rate: 'shr_standard_xxx' },
        { shipping_rate: 'shr_express_xxx' },
      ],
      allow_promotion_codes: true,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: price,
            product_data: {
              name: `Spookified Poster ${size}`,
              images: [fileUrl],
              metadata: { imageId, size, fileUrl },
            },
          },
        },
      ],
      metadata: { imageId, fileUrl, size },
      success_url: `${process.env.SITE_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/upload?cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg || 'Checkout failed' }, { status: 500 })
  }
}
