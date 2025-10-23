// app/api/orders/get/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENV = process.env.PAYPAL_ENV?.toLowerCase() === 'live' ? 'live' : 'sandbox';
const BASE =
  ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET || '';

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('PayPal auth failed');
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error('No access token returned by PayPal');
  return json.access_token;
}

/** Minimal shape for PayPal order we read */
type PayPalAmount = { value?: string; currency_code?: string };
type PayPalPurchaseUnit = {
  amount?: PayPalAmount;
  description?: string;
  custom_id?: string;
  shipping?: {
    name?: { full_name?: string };
    address?: Record<string, unknown>;
  };
};
type PayPalOrder = {
  id?: string;
  create_time?: string;
  payer?: { email_address?: string };
  purchase_units?: PayPalPurchaseUnit[];
};

export async function POST(req: NextRequest) {
  try {
    const { orderId, sessionId } = (await req.json()) as {
      orderId?: string;
      sessionId?: string;
    };

    if (!orderId && !sessionId) {
      return NextResponse.json(
        { error: 'Missing orderId or sessionId' },
        { status: 400 }
      );
    }
    const id = orderId || sessionId!;

    const token = await getAccessToken();
    const r = await fetch(
      `${BASE}/v2/checkout/orders/${encodeURIComponent(id)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    );

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      return NextResponse.json(
        { error: errText || 'Order not found' },
        { status: 404 }
      );
    }

    const paypal = (await r.json()) as PayPalOrder;

    const pu = paypal.purchase_units?.[0];
    const amountVal = pu?.amount?.value ? Number(pu.amount.value) : undefined;
    const currency = pu?.amount?.currency_code || undefined;
    const createdAt = paypal.create_time || undefined;

    // If you set these during create, you can surface them here:
    // const imageId = pu?.custom_id;
    // const title   = pu?.description;

    const result = {
      orderId: paypal.id ?? id,
      amount: Number.isFinite(amountVal ?? NaN) ? amountVal : undefined,
      currency,
      createdAt,
      // payerEmail: paypal.payer?.email_address,
      // shippingName: pu?.shipping?.name?.full_name,
      // shippingAddress: pu?.shipping?.address,
      // imageId,
      // title,
    };

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
