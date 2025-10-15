// /app/api/session/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // no apiVersion

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')!;
  const s = await stripe.checkout.sessions.retrieve(id);
  // look up your stored Gelato order metadata by session.id if you persisted it
  return NextResponse.json({
    id: s.id,
    title: s.metadata?.title,
    fileUrl: s.metadata?.fileUrl,
    email: s.customer_details?.email,
    amount_total: (s.amount_total ?? 0) / 100 + ' ' + (s.currency ?? '').toUpperCase(),
    gelatoOrderId: null // fill from storage if you saved it in webhook
  });
}
