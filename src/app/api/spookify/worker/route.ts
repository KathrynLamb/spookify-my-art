// src/app/api/spookify/worker/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getJob, updateJob, type SpookifyJobInput } from '@/lib/jobs';

const DEFAULT_PROMPT =
  'Tasteful Halloween version while preserving the composition; moody fog, moonlit ambience, warm candle glow; 1–3 soft white friendly ghosts; no text; printable; no gore.';

/* ---------------- logging helpers ---------------- */

const TAG = '[spookify-worker]';

function safePreview(v: unknown, max = 800): string {
  try {
    const s = JSON.stringify(
      v,
      (_, val) => (typeof val === 'string' && val.length > 200 ? `${val.slice(0, 200)}…(${val.length})` : val),
      2
    );
    return s.length > max ? s.slice(0, max) + `…(${s.length})` : s;
  } catch {
    return String(v);
  }
}

function log(...args: unknown[]) {
  console.log(TAG, ...args);
}
function warn(...args: unknown[]) {
  console.warn(TAG, ...args);
}
function errlog(...args: unknown[]) {
  console.error(TAG, ...args);
}

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
  log('sanitizeTarget.INPUT', {
    type: typeof input,
    inputPreview: safePreview(input),
    orientation,
  });

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

  const out = { aspect, minWidth, mode };
  log('sanitizeTarget.OUTPUT', out);
  return out;
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
    log('adapter: using sharp');

    const conformTo = async (
      pngBuffer: Buffer,
      opts: { aspect?: number; minWidth?: number; mode: 'cover' | 'contain' }
    ): Promise<Buffer> => {
      const img = sharp(pngBuffer);
      const meta = await img.metadata();
      log('sharp.meta', meta);

      if (!opts.aspect) {
        if (opts.minWidth && (meta.width ?? 0) < opts.minWidth) {
          const w = opts.minWidth;
          const h = Math.round(w * ((meta.height ?? 0) / (meta.width || 1)));
          log('sharp.resize inside', { w, h });
          return await img.resize(w, h, { fit: 'inside', withoutEnlargement: false }).png().toBuffer();
        }
        return pngBuffer;
      }

      const targetW = Math.max(opts.minWidth ?? 2048, 1024);
      const targetH = Math.max(1, Math.round(targetW / opts.aspect));
      log('sharp.resize cover/contain', { targetW, targetH, fit: opts.mode });

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
  } catch (e) {
    warn('sharp unavailable, falling back to jimp:', (e as Error)?.message || e);
  }

  // ---- Jimp v1 fallback (object constructor) ----
  type JimpImage = {
    bitmap: { width: number; height: number };
    resize: (w: number, h: number) => JimpImage;
    crop: (x: number, y: number, w: number, h: number) => JimpImage;
    clone: () => JimpImage;
    composite: (src: JimpImage, x: number, y: number) => JimpImage;
    getBufferAsync: (mime: string) => Promise<Buffer>;
  };
  type JimpCtor = {
    new (opts: { width: number; height: number; background?: number | string }): JimpImage; // v1 shape
    read: (buf: Buffer | string) => Promise<JimpImage>;
    MIME_PNG: string;
    MIME_JPEG: string;
  };

  const jimpModUnknown: unknown = await import('jimp');
  const jimpNs = jimpModUnknown as { default?: unknown; Jimp?: unknown };
  const jimpDefault = (jimpNs.default ?? jimpNs) as unknown;
  const jimpNamed = jimpNs.Jimp as unknown;
  const Jimp: JimpCtor = (jimpNamed ?? jimpDefault) as JimpCtor;

  log('adapter: using jimp');

  const conformTo = async (
    pngBuffer: Buffer,
    opts: { aspect?: number; minWidth?: number; mode: 'cover' | 'contain' }
  ): Promise<Buffer> => {
    const img = await Jimp.read(pngBuffer);
    const srcW = img.bitmap.width;
    const srcH = img.bitmap.height;
    log('jimp.src', { srcW, srcH, opts });

    if (!opts.aspect) {
      if (opts.minWidth && srcW < opts.minWidth) {
        const w = opts.minWidth;
        const h = Math.round(w * (srcH / srcW));
        log('jimp.resize inside', { w, h });
        img.resize(w, h);
      }
      const out = await img.getBufferAsync(Jimp.MIME_PNG);
      log('jimp.output no-aspect bytes', out.byteLength);
      return out;
    }

    const targetW = Math.max(opts.minWidth ?? 2048, 1024);
    const targetH = Math.max(1, Math.round(targetW / opts.aspect));
    const srcAspect = srcW / srcH;
    const tgtAspect = targetW / targetH;
    log('jimp.tgt', { targetW, targetH, srcAspect, tgtAspect });

    if (opts.mode === 'contain') {
      const clone = img.clone();
      if (srcAspect > tgtAspect) {
        const h = Math.round(targetW / srcAspect);
        clone.resize(targetW, h);
        const canvas = new Jimp({ width: targetW, height: targetH, background: 0xffffffff });
        const top = Math.round((targetH - h) / 2);
        canvas.composite(clone as unknown as JimpImage, 0, top);
        const out = await canvas.getBufferAsync(Jimp.MIME_PNG);
        log('jimp.output contain bytes', out.byteLength);
        return out;
      } else {
        const w = Math.round(targetH * srcAspect);
        clone.resize(w, targetH);
        const canvas = new Jimp({ width: targetW, height: targetH, background: 0xffffffff });
        const left = Math.round((targetW - w) / 2);
        canvas.composite(clone as unknown as JimpImage, left, 0);
        const out = await canvas.getBufferAsync(Jimp.MIME_PNG);
        log('jimp.output contain bytes', out.byteLength);
        return out;
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
      log('jimp.crop', { cropW, cropH, left, top });
      img.crop(left, top, cropW, cropH).resize(targetW, targetH);
      const out = await img.getBufferAsync(Jimp.MIME_PNG);
      log('jimp.output cover bytes', out.byteLength);
      return out;
    }
  };

  return { name: 'jimp', conformTo };
}

async function conformImage(
  pngBuffer: Buffer,
  opts: { aspect?: number; minWidth?: number; mode: 'cover' | 'contain' }
) {
  const adapter = await loadAdapter();
  log('conformImage.adapter', adapter.name, opts);
  return adapter.conformTo(pngBuffer, opts);
}

/* ---------------- route ---------------- */

export async function POST(req: Request) {
  const startTs = Date.now();
  let jobId = '';
  try {
    const bodyText = await req.text();
    log('POST body raw', bodyText);
    const body = bodyText ? JSON.parse(bodyText) : {};

    jobId = body?.id ?? '';
    if (!jobId) {
      errlog('Missing job id in POST body');
      return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
    }

    const job = await getJob(jobId);
    log('job.lookup', { found: !!job, id: jobId });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    await updateJob(jobId, { status: 'processing' });

    const ji = job.input as unknown;
    log('job.input typeof', typeof ji);
    log('job.input preview', safePreview(ji));
    if (typeof ji !== 'object' || ji === null || Array.isArray(ji)) {
      const msg = `Worker expected object for job.input, got: ${typeof ji}`;
      errlog(msg, 'VALUE=', ji);
      await updateJob(jobId, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (!isSpookifyJobInput(ji)) {
      const msg = 'Job input missing imageId';
      errlog(msg, 'job.input=', safePreview(ji));
      await updateJob(jobId, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const input = ji as SpookifyJobInput;
    log('input.keys', Object.keys(input));

    const imageId = input.imageId;
    const promptOverride = input.promptOverride ?? null;

    const { aspect, minWidth, mode } = sanitizeTarget(input.target, input.orientation ?? undefined);

    // 1) meta.json → original URL
    const metaUrl = metaUrlFrom(imageId);
    log('meta.url', metaUrl);
    if (!metaUrl) {
      const msg = 'Missing NEXT_PUBLIC_BLOB_BASE_URL for meta lookup';
      errlog(msg);
      await updateJob(jobId, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const metaRes = await fetch(metaUrl, { cache: 'no-store' });
    const metaText = await metaRes.clone().text().catch(() => '');
    log('meta.fetch.status', metaRes.status, metaRes.statusText);
    log('meta.fetch.bodyPreview', metaText.slice(0, 400));

    if (!metaRes.ok) {
      const msg = `Original not found (meta missing): ${metaRes.status}`;
      errlog(msg);
      await updateJob(jobId, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    const meta = (await metaRes.json()) as Meta;
    log('meta.parsed', safePreview(meta));
    const fileUrl = meta.fileUrl;
    if (!fileUrl) {
      const msg = 'Original not found (no fileUrl)';
      errlog(msg, 'meta=', safePreview(meta));
      await updateJob(jobId, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 404 });
    }

    // 2) fetch original
    const imgRes = await fetch(fileUrl, { cache: 'no-store' });
    const imgStatus = { status: imgRes.status, text: imgRes.statusText };
    log('image.fetch.status', imgStatus);

    if (!imgRes.ok) {
      const raw = await imgRes.text().catch(() => '');
      const msg = `Could not fetch original: ${raw || imgRes.statusText}`;
      errlog(msg);
      await updateJob(jobId, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const srcArrayBuf = await imgRes.arrayBuffer();
    log('image.bytes', srcArrayBuf.byteLength);
    const srcBlob = new Blob([srcArrayBuf], { type: 'image/png' });

    // 3) prompt
    const prompt =
      (promptOverride && promptOverride.trim()) ||
      (meta.finalizedPrompt && meta.finalizedPrompt.trim()) ||
      DEFAULT_PROMPT;
    log('prompt.len', prompt.length);
    log('prompt.preview', prompt.slice(0, 200));

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const msg = 'Missing OPENAI_API_KEY';
      errlog(msg);
      await updateJob(jobId, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    // 4) Generate edit
    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('prompt', prompt);
    form.append('size', '1024x1024');
    form.append('quality', 'high');
    form.append('image', srcBlob, 'source.png');

    log('openai.request', { model: 'gpt-image-1', size: '1024x1024', quality: 'high' });

    const resp = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    log('openai.status', resp.status, resp.statusText);

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

      errlog('openai.error', { status: resp.status, preview: text.slice(0, 600) });
      await updateJob(jobId, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const textRaw = await resp.text();
    log('openai.body.len', textRaw.length);
    log('openai.body.preview', textRaw.slice(0, 300), '…', textRaw.slice(-120));
    let json: { data?: Array<{ b64_json?: string }> };
    try {
      json = JSON.parse(textRaw);
    } catch (e) {
      const msg = `OpenAI returned non-JSON: ${(e as Error)?.message}`;
      errlog(msg);
      await updateJob(jobId, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) {
      const msg = 'Image edit returned no data';
      errlog(msg, 'json=', safePreview(json));
      await updateJob(jobId, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    log('openai.image.b64.len', b64.length);

    // 5) Conform to requested aspect / size
    const squarePng = Buffer.from(b64, 'base64');
    log('conform.input.bytes', squarePng.byteLength);
    const fitted = await conformImage(squarePng, { aspect, minWidth, mode });
    log('conform.output.bytes', fitted.byteLength);

    const dataUrl = `data:image/png;base64,${fitted.toString('base64')}`;

    await updateJob(jobId, {
      status: 'done',
      resultUrl: dataUrl,
      error: null,
      input: {
        ...input,
        target: { aspect, minWidth, mode },
      } as SpookifyJobInput,
    });

    log('DONE', { ms: Date.now() - startTs, jobId });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errlog('FATAL', msg);
    console.error('[spookify-worker] FATAL full', err);
    if (jobId) {
      await updateJob(jobId, { status: 'error', error: msg });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
