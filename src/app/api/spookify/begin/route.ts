// app/api/spookify/begin/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { newJob, createJob, type SpookifyJobInput } from '@/lib/jobs';

/* ---------- Types ---------- */
type Orientation = 'Horizontal' | 'Vertical' | 'Square';

type BeginBody = {
  id?: string; // legacy alias for imageId
  imageId?: string;
  promptOverride?: string | null;
  orientation?: Orientation;
  target?: {
    aspect?: number;
    minWidth?: number;
    mode?: 'cover' | 'contain';
  };
  title?: string | null;
};

/* ---------- Helpers ---------- */
/** Absolute base URL: prefer env, else derive from the request (works locally & on Vercel). */
function getBaseUrl(req: Request): string {
  const env = (process.env.NEXT_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  if (env && /^https?:\/\//i.test(env)) return env;

  const url = new URL(req.url);
  const proto = url.protocol?.replace(':', '') || 'http';
  const host = url.host || 'localhost:3000';
  return `${proto}://${host}`;
}

function sanitizeOrientation(o: unknown): Orientation | undefined {
  return o === 'Horizontal' || o === 'Vertical' || o === 'Square' ? o : undefined;
}

function sanitizeTarget(t: BeginBody['target']): SpookifyJobInput['target'] | undefined {
  if (!t) return undefined;
  const aspect =
    typeof t.aspect === 'number' && isFinite(t.aspect) && t.aspect > 0 ? t.aspect : undefined;
  const minWidth =
    typeof t.minWidth === 'number' && isFinite(t.minWidth)
      ? Math.max(512, Math.min(12000, Math.round(t.minWidth)))
      : undefined;
  const mode: 'cover' | 'contain' = t.mode === 'contain' ? 'contain' : 'cover';
  return { aspect, minWidth, mode };
}

/* ---------- Route ---------- */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const userId = session?.user?.id ?? null;

    // Read and validate body
    const body = (await req.json().catch(() => ({}))) as BeginBody;
    const imageId = (body.imageId || body.id || '').trim();

    let productPlan: { productId: string; reasonShort?: string } | null = null;
try {
  const r = await fetch(`${getBaseUrl(req)}/api/get-plan?id=${encodeURIComponent(imageId)}`, { cache: 'no-store' });
  const j = await r.json().catch(() => ({}));
  if (j?.productPlan?.productId) productPlan = j.productPlan;
} catch { /* noop */ }

    if (!imageId) {
      return NextResponse.json({ error: 'Missing imageId' }, { status: 400 });
    }

    const orientation = sanitizeOrientation(body.orientation);
    const target = sanitizeTarget(body.target);
    const title = (body.title ?? 'Haunted Portrait') || 'Haunted Portrait';
    const promptOverride =
      typeof body.promptOverride === 'string' ? body.promptOverride : null;

    // Create & persist job (server issues a fresh job id; ignores any client-sent job ids)
    const job = newJob({
      imageId,
      promptOverride,
      orientation,
      target,
      title,
      userId, // may be null if unauthenticated
      productPlan,
    });
    await createJob(job);

    // Fire the worker (non-blocking); client will poll /status
    const base = getBaseUrl(req);
    console.log("BASE", base)
    fetch(`${base}/api/spookify/worker`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // IMPORTANT: pass the JOB id (not the image id)
      body: JSON.stringify({ id: job.id, input: job.input }),
      cache: 'no-store',
    }).catch((e) => {
      // swallow; the client will see job error via /status if worker fails
      console.warn('[begin] worker fetch failed (non-blocking)', e);
    });

    return NextResponse.json(
      { ok: true, jobId: job.id },
      {
        headers: {
          // cache slayer for mobile/Safari
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (e) {
    console.error('[begin] fatal', e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
