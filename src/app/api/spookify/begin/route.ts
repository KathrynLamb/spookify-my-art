// // /app/api/spookify/begin/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { saveJob, type Job, type SpookifyJobInput } from '@/lib/jobs';

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// type BeginBody = {
//   id?: string;                // legacy alias for imageId
//   imageId?: string;
//   promptOverride?: string | null;
//   // NEW: generation/print constraints (all optional)
//   orientation?: 'Horizontal' | 'Vertical' | 'Square';
//   target?: {
//     aspect?: number;          // e.g. 1.4 for 70×50 (Horizontal). Square = 1
//     minWidth?: number;        // e.g. 3000px+ for print
//     mode?: 'cover' | 'contain'; // 'cover' = crop to fit, 'contain' = pad to fit
//   };
// };

// export async function POST(req: NextRequest) {
//   try {
//     const body = (await req.json()) as BeginBody;

//     const imageId = body.imageId || body.id;
//     if (!imageId) {
//       return NextResponse.json({ error: 'Missing imageId' }, { status: 400 });
//     }

//     // ---- normalize target ----
//     const orientation = body.orientation; // optional UX hint for logs/analytics
//     const aspect = normalizeAspect(body.target?.aspect, orientation);
//     const minWidth = normalizeMinWidth(body.target?.minWidth);
//     const mode = body.target?.mode === 'contain' ? 'contain' : 'cover';

//     // Build input for the worker (extend your SpookifyJobInput type accordingly)
//     const input: SpookifyJobInput = {
//       imageId,
//       promptOverride: body.promptOverride ?? null,
//       // NEW: downstream hints for generation + post-process
//       target: { aspect, minWidth, mode },
//       orientation, // optional; useful for analytics or UI echoes
//     } as SpookifyJobInput;

//     // Create and persist the job
//     const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2)}`;
//     const job: Job = {
//       id: jobId,
//       status: 'queued',
//       imageId,
//       input,
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//     };
//     await saveJob(job);

//     // Fire-and-forget the worker
//     const workerUrl = new URL('/api/spookify/worker', req.url);
//     fetch(workerUrl.toString(), {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ id: jobId }),
//       cache: 'no-store',
//     }).catch(() => { /* ignore */ });

//     return NextResponse.json({ ok: true, jobId });
//   } catch (err: unknown) {
//     const msg = err instanceof Error ? err.message : String(err);
//     return NextResponse.json({ error: msg || 'Failed to start job' }, { status: 500 });
//   }
// }

// /* ---------------- helpers ---------------- */

// function normalizeAspect(
//   raw?: number,
//   orientation?: 'Horizontal' | 'Vertical' | 'Square'
// ): number | undefined {
//   if (typeof raw === 'number' && isFinite(raw) && raw > 0.2 && raw < 5) {
//     return round(raw, 1e-3);
//   }
//   if (orientation === 'Square') return 1;
//   // a gentle default if caller only gives orientation
//   if (orientation === 'Horizontal') return 1.4;   // tweak to your catalog (e.g. 70/50 ≈ 1.4)
//   if (orientation === 'Vertical') return round(1 / 1.4, 1e-3);
//   return undefined; // no constraint
// }

// function normalizeMinWidth(n?: number): number | undefined {
//   if (typeof n !== 'number' || !isFinite(n)) return undefined;
//   return Math.max(1024, Math.min(12000, Math.round(n)));
// }

// function round(n: number, step = 1e-3) {
//   return Math.round(n / step) * step;
// }
// /src/app/api/spookify/begin/route.ts
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
