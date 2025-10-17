import { NextResponse } from 'next/server';

const ENV = process.env.PAYPAL_ENV?.toLowerCase() === 'live' ? 'live' : 'sandbox';
const BASE = ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET || '';

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!r.ok) throw new Error('PayPal auth failed');
  const j = await r.json();
  return j.access_token as string;
}

export async function POST(req: Request) {
  try {
    // const { amount, currency, title, imageId, fileUrl, size, orientation, frameColor } = await req.json();
    const { amount, currency, title, imageId,  } = await req.json();
    // Runtime validation (light)
    if (!amount || !currency) {
      return NextResponse.json({ error: 'Missing amount/currency' }, { status: 400 });
    }

    const token = await getAccessToken();

    const body = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: String(currency).toUpperCase(),
            value: String(amount), // major units
          },
          description: (title || 'Custom Printed Wall Art').slice(0, 127),
          custom_id: imageId?.slice(0, 127) || undefined,
        },
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    };

    const r = await fetch(`${BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const j = await r.json();
    if (!r.ok) {
      return NextResponse.json({ error: j?.message || 'Create order failed', details: j }, { status: 500 });
    }

    return NextResponse.json({ orderID: j.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
