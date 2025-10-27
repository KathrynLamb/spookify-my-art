// src/app/api/spookify/worker/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getJob, updateJob, type SpookifyJobInput } from '@/lib/jobs';

const DEFAULT_PROMPT =
  'Tasteful Halloween version while preserving the composition; moody fog, moonlit ambience, warm candle glow; 1–3 soft white friendly ghosts; no text; printable; no gore.';

function metaUrlFrom(imageId: string): string | null {
  const base = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/+$/, '');
  if (!base) return null;
  return `${base}/spookify/${encodeURIComponent(imageId)}/meta.json`;
}

type Meta = {
  fileUrl: string;
  bytes?: number;
  mime?: string;
  finalizedPrompt?: string;
  createdAt?: number;
  version?: number;
};

function isSpookifyJobInput(v: unknown): v is SpookifyJobInput {
  return !!v && typeof v === 'object' && typeof (v as SpookifyJobInput).imageId === 'string';
}

/* ---------------- aspect helpers ---------------- */

function sanitizeTarget(
  input?: SpookifyJobInput['target'],
  orientation?: 'Horizontal' | 'Vertical' | 'Square'
) {
  let aspect = input?.aspect;
  if (!(typeof aspect === 'number' && isFinite(aspect) && aspect > 0.2 && aspect < 5)) {
    if (orientation === 'Square') aspect = 1;
    else if (orientation === 'Horizontal') aspect = 1.4;
    else if (orientation === 'Vertical') aspect = 1 / 1.4;
    else aspect = undefined;
  }

  const minWidth =
    typeof input?.minWidth === 'number' && isFinite(input?.minWidth)
      ? Math.max(1024, Math.min(12000, Math.round(input!.minWidth!)))
      : undefined;

  const mode: 'cover' | 'contain' = input?.mode === 'contain' ? 'contain' : 'cover';

  return { aspect, minWidth, mode };
}

/* ---------------- image adapter (Sharp → Jimp fallback) ---------------- */

type ImageAdapter = {
  name: 'sharp' | 'jimp';
  conformTo(
    pngBuffer: Buffer,
    opts: { aspect?: number; minWidth?: number; mode: 'cover' | 'contain' }
  ): Promise<Buffer>;
};

async function loadAdapter(): Promise<ImageAdapter> {
  try {
    const mod = await import('sharp');
    const sharp = mod.default;

    const conformTo = async (
      pngBuffer: Buffer,
      opts: { aspect?: number; minWidth?: number; mode: 'cover' | 'contain' }
    ): Promise<Buffer> => {
      const img = sharp(pngBuffer);
      const meta = await img.metadata();

      if (!opts.aspect) {
        if (opts.minWidth && (meta.width ?? 0) < opts.minWidth) {
          const w = opts.minWidth;
          const h = Math.round(w * ((meta.height ?? 0) / (meta.width || 1)));
          return await img.resize(w, h, { fit: 'inside', withoutEnlargement: false }).png().toBuffer();
        }
        return pngBuffer;
      }

      const targetW = Math.max(opts.minWidth ?? 2048, 1024);
      const targetH = Math.max(1, Math.round(targetW / opts.aspect));

      return await img
        .resize(targetW, targetH, {
          fit: opts.mode === 'contain' ? 'contain' : 'cover',
          position: 'entropy',
          background: opts.mode === 'contain' ? { r: 255, g: 255, b: 255, alpha: 1 } : undefined,
          withoutEnlargement: false,
        })
        .png()
        .toBuffer();
    };

    return { name: 'sharp', conformTo };
  } catch (err) {
    console.warn('[image] sharp unavailable, falling back to jimp:', (err as Error)?.message || err);
  }

  const Jimp = (await import('jimp')).default;

  const conformTo = async (
    pngBuffer: Buffer,
    opts: { aspect?: number; minWidth?: number; mode: 'cover' | 'contain' }
  ): Promise<Buffer> => {
    const img = await Jimp.read(pngBuffer);
    const srcW = img.bitmap.width;
    const srcH = img.bitmap.height;

    if (!opts.aspect) {
      if (opts.minWidth && srcW < opts.minWidth) {
        const w = opts.minWidth;
        const h = Math.round(w * (srcH / srcW));
        img.resize(w, h);
      }
      return await img.getBufferAsync(Jimp.MIME_PNG);
    }

    const targetW = Math.max(opts.minWidth ?? 2048, 1024);
    const targetH = Math.max(1, Math.round(targetW / opts.aspect));
    const srcAspect = srcW / srcH;
    const tgtAspect = targetW / targetH;

    if (opts.mode === 'contain') {
      const clone = img.clone();
      if (srcAspect > tgtAspect) {
        const h = Math.round(targetW / srcAspect);
        clone.resize(targetW, h);
        const canvas = new Jimp(targetW, targetH, 0xffffffff);
        const top = Math.round((targetH - h) / 2);
        canvas.composite(clone, 0, top);
        return await canvas.getBufferAsync(Jimp.MIME_PNG);
      } else {
        const w = Math.round(targetH * srcAspect);
        clone.resize(w, targetH);
        const canvas = new Jimp(targetW, targetH, 0xffffffff);
        const left = Math.round((targetW - w) / 2);
        canvas.composite(clone, left, 0);
        return await canvas.getBufferAsync(Jimp.MIME_PNG);
      }
    } else {
      let cropW = srcW;
      let cropH = srcH;
      if (srcAspect > tgtAspect) {
        cropH = srcH;
        cropW = Math.round(cropH * tgtAspect);
      } else {
        cropW = srcW;
        cropH = Math.round(cropW / tgtAspect);
      }
      const left = Math.max(0, Math.round((srcW - cropW) / 2));
      const top = Math.max(0, Math.round((srcH - cropH) / 2));
      img.crop({ x: left, y: top, w: cropW, h: cropH }).resize(targetW, targetH);
      return await img.getBufferAsync(Jimp.MIME_PNG);
    }
  };

  return { name: 'jimp', conformTo };
}

async function conformImage(
  pngBuffer: Buffer,
  opts: { aspect?: number; minWidth?: number; mode: 'cover' | 'contain' }
) {
  const adapter = await loadAdapter();
  return adapter.conformTo(pngBuffer, opts);
}

/* ---------------- route ---------------- */

export async function POST(req: Request) {
  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: 'Missing job id' }, { status: 400 });

  const job = await getJob(id);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  try {
    await updateJob(id, { status: 'processing' });

    const input = job.input;
    if (!isSpookifyJobInput(input)) {
      const msg = 'Job input missing imageId';
      await updateJob(id, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const imageId = input.imageId;
    const promptOverride = input.promptOverride ?? null;

    const { aspect, minWidth, mode } = sanitizeTarget(input.target, input.orientation ?? undefined);

    // 1) meta.json → original URL
    const metaUrl = metaUrlFrom(imageId);
    if (!metaUrl) {
      const msg = 'Missing NEXT_PUBLIC_BLOB_BASE_URL for meta lookup';
      await updateJob(id, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const metaRes = await fetch(metaUrl, { cache: 'no-store' });
    if (!metaRes.ok) {
      const msg = `Original not found (meta missing): ${metaRes.status}`;
      await updateJob(id, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    const meta = (await metaRes.json()) as Meta;
    const fileUrl = meta.fileUrl;
    if (!fileUrl) {
      const msg = 'Original not found (no fileUrl)';
      await updateJob(id, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 404 });
    }

    // 2) fetch original
    const imgRes = await fetch(fileUrl, { cache: 'no-store' });
    if (!imgRes.ok) {
      const raw = await imgRes.text().catch(() => '');
      const msg = `Could not fetch original: ${raw || imgRes.statusText}`;
      await updateJob(id, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const srcArrayBuf = await imgRes.arrayBuffer();
    const srcBlob = new Blob([srcArrayBuf], { type: 'image/png' });

    // 3) prompt
    const prompt =
      (promptOverride && promptOverride.trim()) ||
      (meta.finalizedPrompt && meta.finalizedPrompt.trim()) ||
      DEFAULT_PROMPT;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const msg = 'Missing OPENAI_API_KEY';
      await updateJob(id, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    // 4) Generate edit
    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('prompt', prompt);
    form.append('size', '1024x1024');
    form.append('quality', 'high');
    form.append('image', srcBlob, 'source.png');

    const resp = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      const lower = text.toLowerCase();
      const maybeSafety =
        resp.status === 400 ||
        lower.includes('safety') ||
        lower.includes('violence') ||
        lower.includes('policy') ||
        lower.includes('content');

      const msg = maybeSafety
        ? 'Prompt rejected by safety system — try a gentler description (no gore/violence).'
        : `Image generation failed: ${text || resp.statusText}`;

      await updateJob(id, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const json = (await resp.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) {
      const msg = 'Image edit returned no data';
      await updateJob(id, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // 5) Conform to requested aspect / size
    const squarePng = Buffer.from(b64, 'base64');
    const fitted = await conformImage(squarePng, { aspect, minWidth, mode });
    const dataUrl = `data:image/png;base64,${fitted.toString('base64')}`;

    await updateJob(id, {
      status: 'done',
      resultUrl: dataUrl,
      error: null,
      input: {
        ...input,
        target: { aspect, minWidth, mode },
      } as SpookifyJobInput,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateJob(id, { status: 'error', error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
