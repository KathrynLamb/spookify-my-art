// src/app/api/spookify/selftest/route.ts
import { NextResponse } from 'next/server';
import { kvSelfTest } from '@/lib/jobs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const r = await kvSelfTest();
  return NextResponse.json(r);
}
