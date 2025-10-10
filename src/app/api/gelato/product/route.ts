// src/app/api/gelato/product/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GELATO_BASE = 'https://product.gelatoapis.com/v3';

function headers() {
  const key = process.env.GELATO_API_KEY;
  if (!key) throw new Error('Missing GELATO_API_KEY');
  return { 'X-API-KEY': key };
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Narrow helper for unknown -> has optional "message" string
function getErrorMessage(u: unknown): string | undefined {
  if (u && typeof u === 'object' && 'message' in u) {
    const m = (u as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    const u = new URL(req.url);
    const productUid = u.searchParams.get('uid');
    if (!productUid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const r = await fetch(
      `${GELATO_BASE}/products/${encodeURIComponent(productUid)}`,
      { headers: headers() }
    );

    const text = await r.text();

    // Parse but keep unknown for type safety
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (!r.ok) {
      const msg = getErrorMessage(json) ?? 'Gelato get product failed';
      return NextResponse.json({ error: msg, raw: json }, { status: r.status });
    }

    // Pass through the successful payload as-is
    return NextResponse.json(json);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
