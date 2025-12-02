// src/app/api/prodigi/health/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prodigiHealth } from '@/lib/prodigi';

export async function GET() {
  try {
    const info = await prodigiHealth();
    return NextResponse.json(info, { status: info.ok ? 200 : 502 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
  
}
