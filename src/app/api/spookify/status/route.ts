// src/app/api/spookify/status/route.ts
import { NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id') || '';
  const job = await getJob(id);
  console.log("JOB===", job)
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    status: job.status,
    resultUrl: job.resultUrl ?? null,
    error: job.error ?? null,
  });
}
