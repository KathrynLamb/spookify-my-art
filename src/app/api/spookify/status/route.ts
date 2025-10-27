// src/app/api/spookify/status/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getJob, type SpookifyJob } from '@/lib/jobs';

type StatusPayload = {
  status: SpookifyJob['status'];
  resultUrl?: string | null;
  resultFullUrl?: string | null;
  error?: string | null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const job = await getJob(id);
  if (!job) {
    // treat unknown ID as not-yet-created / queued
    const payload: StatusPayload = { status: 'queued' };
    return NextResponse.json(payload);
  }

  const payload: StatusPayload = {
    status: job.status,
    resultUrl: job.resultUrl ?? null,
    resultFullUrl: job.resultFullUrl ?? null,
    error: job.error ?? null,
  };

  return NextResponse.json(payload);
}
