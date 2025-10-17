import { NextRequest, NextResponse } from 'next/server';
import { saveJob, type Job, type SpookifyJobInput } from '@/lib/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { id, imageId: idAlt, promptOverride } = (await req.json()) as {
      id?: string;
      imageId?: string;
      promptOverride?: string | null;
    };

    const imageId = idAlt || id;
    if (!imageId) {
      return NextResponse.json({ error: 'Missing imageId' }, { status: 400 });
    }

    // Create a job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const input: SpookifyJobInput = { imageId, promptOverride: promptOverride ?? null };

    const job: Job = {
      id: jobId,
      status: 'queued',
      imageId,
      input,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveJob(job);

    // Fire-and-forget the worker using this same deployment origin
    const workerUrl = new URL('/api/spookify/worker', req.url);
    // Intentionally don't await; but we also don't want unhandled rejections
    fetch(workerUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: jobId }),
    }).catch(() => { /* ignore */ });

    return NextResponse.json({ ok: true, jobId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg || 'Failed to start job' }, { status: 500 });
  }
}
