// src/app/api/gelato/price/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GELATO_BASE = 'https://product.gelatoapis.com/v3';
const headers = () => ({ 'X-API-KEY': process.env.GELATO_API_KEY! });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const u = new URL(req.url);
    const productUid = u.searchParams.get('uid');
    const country = u.searchParams.get('country') ?? 'GB';
    const currency = u.searchParams.get('currency') ?? 'GBP';
    if (!productUid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });

    // Check Gelato docs for exact query for your account; this is a placeholder route name.
    const r = await fetch(
      `${GELATO_BASE}/price?productUid=${encodeURIComponent(productUid)}&country=${country}&currency=${currency}`,
      { headers: headers() }
    );

    const text = await r.text();
    let json: unknown;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!r.ok) return NextResponse.json({ error: 'Price fetch failed', raw: json }, { status: r.status });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
