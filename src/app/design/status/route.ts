// app/api/design/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const job = await kv.get(id);

  if (!job) {
    return NextResponse.json(
      { status: 'error', error: 'Unknown job id' },
      { status: 404 }
    );
  }

  return NextResponse.json(job);
}
