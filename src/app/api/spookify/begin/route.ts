
import { NextResponse } from 'next/server';
import { createJob, newJob, type SpookifyJobInput } from '@/lib/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Orientation = 'Horizontal' | 'Vertical' | 'Square';

type BeginBody = {
  id?: string; // imageId
  promptOverride?: string;
  orientation?: Orientation;
  target?: {
    aspect?: number;
    minWidth?: number;
    mode?: 'cover' | 'contain';
  };
};

/** Build an absolute base URL that works locally, in preview, and in prod. */
function getBaseUrl(req: Request): string {
  // Prefer explicit env (set this to your site origin in prod), else derive from headers.
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, '');
  if (envBase) return envBase;

  const url = new URL(req.url);
  const proto =
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'development')
      ? 'http'
      : (url.protocol.replace(':', '') || 'https');

  // In Vercel/Edge, headers carry the deployed host.
  const host =
    (url.host ||
      (req.headers.get('x-forwarded-host') as string) ||
      req.headers.get('host') ||
      'localhost:3000');

  return `${proto}://${host}`.replace(/\/+$/, '');
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BeginBody;

    // Validate minimal input
    if (!body?.id || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'Missing image id' }, { status: 400 });
    }

    // Sanitize optional fields
    const orientation = ((): Orientation | undefined => {
      if (!body.orientation) return undefined;
      if (body.orientation === 'Horizontal' || body.orientation === 'Vertical' || body.orientation === 'Square') {
        return body.orientation;
      }
      return undefined;
    })();

    const target = ((): SpookifyJobInput['target'] | undefined => {
      if (!body.target) return undefined;
      const aspect =
        typeof body.target.aspect === 'number' && isFinite(body.target.aspect) && body.target.aspect > 0
          ? body.target.aspect
          : undefined;
      const minWidth =
        typeof body.target.minWidth === 'number' && isFinite(body.target.minWidth)
          ? Math.max(512, Math.min(12000, Math.round(body.target.minWidth)))
          : undefined;
      const mode: 'cover' | 'contain' = body.target.mode === 'contain' ? 'contain' : 'cover';
      return { aspect, minWidth, mode };
    })();

    // Create & persist job
    const job = newJob({
      imageId: body.id,
      promptOverride: body.promptOverride ?? null,
      orientation,
      target,
    });
    await createJob(job);

    // Fire the worker (don’t await). Use absolute URL to avoid instance skew.
    const base = getBaseUrl(req);
    void fetch(`${base}/api/spookify/worker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Important: pass the JOB id (not image id)
      body: JSON.stringify({ id: job.id }),
      cache: 'no-store',
    }).catch(() => {
      // Swallow; client will poll /status and see an error if worker fails.
    });

    return NextResponse.json(
      { jobId: job.id },
      {
        headers: {
          // Mobile/Safari cache slayer
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
