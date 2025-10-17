import { NextResponse } from 'next/server';
import { getJob, updateJob, type SpookifyJobInput } from '@/lib/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // 4) OpenAI images edit
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

    const dataUrl = `data:image/png;base64,${b64}`;

    await updateJob(id, { status: 'done', resultUrl: dataUrl, error: null });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateJob(id, { status: 'error', error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
