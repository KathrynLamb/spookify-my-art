// src/app/api/kv-selftest/route.ts
import { NextResponse } from 'next/server';
import { kvSelfTest } from '@/lib/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await kvSelfTest();
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
