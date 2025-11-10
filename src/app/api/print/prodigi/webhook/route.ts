// src/app/api/print/prodigi/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Upsert status into your DB; keep idempotent.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  // Typical props you’ll see: { orderId, merchantReference, status, tracking, items: [...] }
  // Store status: 'received' | 'inProduction' | 'shipped' | 'delivered' | 'cancelled' | 'error'
  // Verify signature if your account supports it. Otherwise, at least check source IP allow-list.
  console.log('[Prodigi webhook]', body);

  // TODO: persist in DB (orders table). Then fan-out user emails if desired.
  return NextResponse.json({ ok: true });
}
