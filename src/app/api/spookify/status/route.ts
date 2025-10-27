// src/app/api/spookify/status/route.ts
import { NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Accept both ?id= and ?jobId= (some clients use one or the other)
  const id = (url.searchParams.get('id') || url.searchParams.get('jobId') || '').trim();

  console.log('[spookify-status] query id =', id || '(empty)');

  if (!id) {
    return NextResponse.json(
      { error: 'Missing id' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const job = await getJob(id);
  console.log('[spookify-status] job =', job ? { id: job.id, status: job.status } : null);

  if (!job) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(
    {
      status: job.status,
      resultUrl: job.resultUrl ?? null,
      error: job.error ?? null,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
