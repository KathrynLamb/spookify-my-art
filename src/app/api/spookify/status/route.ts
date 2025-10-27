// src/app/api/spookify/status/route.ts
import { NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id') || url.searchParams.get('jobId') || '';

  if (!id) {
    return NextResponse.json({ error: 'Missing job id' }, { status: 400, headers: noCache() });
  }

  const job = await getJob(id);
  console.log('[spookify-status] id =', id, 'found =', !!job);

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noCache() });
  }

  return NextResponse.json(
    {
      status: job.status,
      resultUrl: job.resultUrl ?? null,
      error: job.error ?? null,
    },
    { headers: noCache() }
  );
}

function noCache() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    Pragma: 'no-cache',
  };
}
