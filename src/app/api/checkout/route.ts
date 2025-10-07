import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, imageId, size = '50x70', price = 2999 } = await req.json()
    if (!fileUrl || !imageId) return NextResponse.json({ error: 'Missing fileUrl or imageId' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      allow_promotion_codes: true,
      customer_creation: 'if_required',
      shipping_address_collection: { allowed_countries: ['US','GB','CA','IE','AU','NZ','DE','FR','ES','IT','NL','SE','NO','DK'] },
      shipping_options: [
        { shipping_rate: 'shr_1SFagMGnJ56Hlf5V4QLxUfpj' }, // create in dashboard
        { shipping_rate: 'shr_1SFahZGnJ56Hlf5VT0j9kVaW' },
      ],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp', // or 'gbp'
            unit_amount: price, // 2999 = $29.99
            product_data: {
              name: `Spookified Poster ${size}`,
              images: [fileUrl], // shows in Stripe UI
              metadata: { imageId, size, fileUrl }
            },
          },
        },
      ],
      metadata: {
        imageId,
        fileUrl,
        size,
      },
      success_url: `${process.env.SITE_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/upload?cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Checkout failed' }, { status: 500 })
  }
}
