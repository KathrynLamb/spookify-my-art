// src/app/api/upload-original/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type JsonBody = {
  dataUrl?: string;           // data:image/*;base64,....
  filename?: string;          // optional hint, not used for path (id is canonical)
  finalizedPrompt?: string;   // optional
};

function dataUrlToParts(dataUrl: string): { mime: string; buf: Buffer } {
  const m = dataUrl.match(/^data:(?<mime>image\/[a-z0-9+.\-]+);base64,(?<b64>.+)$/i);
  if (!m?.groups?.mime || !m?.groups?.b64) throw new Error('Bad data URL');
  return { mime: m.groups.mime, buf: Buffer.from(m.groups.b64, 'base64') };
}

function log(id: string, ...args: unknown[]) {
  console.log(`[upload-original:${id}]`, ...args);
}
function warn(id: string, ...args: unknown[]) {
  console.warn(`[upload-original:${id}]`, ...args);
}
function err(id: string, ...args: unknown[]) {
  console.error(`[upload-original:${id}]`, ...args);
}

export async function POST(req: NextRequest) {
  const rid = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const contentType = req.headers.get('content-type') || '';
    log(rid, 'START', {
      method: req.method,
      url: req.nextUrl?.pathname || '(no path)',
      contentType,
      headers: {
        'content-length': req.headers.get('content-length') || null,
        accept: req.headers.get('accept') || null,
        'user-agent': req.headers.get('user-agent') || null,
      },
      env: {
        VERCEL: !!process.env.VERCEL,
        BLOB_TOKEN_PRESENT: !!process.env.BLOB_READ_WRITE_TOKEN,
      },
    });

    // ---- Inputs we'll fill from either branch (multipart OR json) ----
    let fileExt: 'png' | 'jpg' = 'jpg';
    let contentMime = 'image/jpeg';
    let finalizedPrompt = '';

    // Exactly one of these will be defined:
    let streamFromForm: ReadableStream | null = null;
    let bufferFromJson: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      // ---------- multipart/form-data ----------
      log(rid, 'Detected multipart/form-data');
      const form = await req.formData();

      const keys = Array.from(form.keys());
      log(rid, 'FormData keys:', keys);

      const file = form.get('file') as File | null;
      finalizedPrompt = ((form.get('finalizedPrompt') as string) || '').trim();

      if (!file) {
        warn(rid, 'No file part present');
        return NextResponse.json({ error: 'No file' }, { status: 400 });
      }

      log(rid, 'File metadata', {
        type: file.type,
        size: file.size,
      });

      contentMime = file.type || 'image/jpeg';
      fileExt = contentMime === 'image/png' ? 'png' : 'jpg';
      streamFromForm = file.stream();

      log(rid, 'Branch=multipart set', { contentMime, fileExt, finalizedPromptLen: finalizedPrompt.length });

    } else if (contentType.includes('application/json')) {
      // ---------- JSON body with dataUrl ----------
      log(rid, 'Detected application/json');
      const bodyText = await req.text();
      log(rid, 'JSON body length', bodyText.length);

      let body: JsonBody;
      try {
        body = JSON.parse(bodyText) as JsonBody;
      } catch (e) {
        err(rid, 'JSON parse error:', (e as Error).message);
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }

      if (!body?.dataUrl) {
        warn(rid, 'Missing dataUrl');
        return NextResponse.json({ error: 'Missing dataUrl' }, { status: 400 });
      }

      try {
        const head = body.dataUrl.slice(0, 64);
        log(rid, 'dataUrl head (truncated)', head);
        const { mime, buf } = dataUrlToParts(body.dataUrl);
        contentMime = mime || 'image/jpeg';
        fileExt = contentMime === 'image/png' ? 'png' : 'jpg';
        bufferFromJson = buf;
        finalizedPrompt = (body.finalizedPrompt || '').trim();
        log(rid, 'Branch=json set', {
          contentMime,
          fileExt,
          finalizedPromptLen: finalizedPrompt.length,
          bufferBytes: bufferFromJson.byteLength,
        });
      } catch (e) {
        err(rid, 'dataUrl parse failed:', (e as Error).message);
        return NextResponse.json({ error: 'Bad data URL' }, { status: 400 });
      }
    } else {
      warn(rid, 'Unsupported content-type', contentType);
      return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 415 });
    }

    // ---------- Canonical paths ----------
    const id = crypto.randomUUID();
    const base = `spookify/${id}`;
    const imgPath = `${base}/original.${fileExt}`;
    const metaPath = `${base}/meta.json`;
    log(rid, 'Paths prepared', { id, imgPath, metaPath });

    // ---------- Save original ----------
    const putStarted = Date.now();
    let img;
    try {
      if (streamFromForm) {
        log(rid, 'Uploading via stream to Blob…');
        img = await put(imgPath, streamFromForm, {
          access: 'public',
          contentType: contentMime,
          addRandomSuffix: false,
        });
      } else {
        log(rid, 'Uploading via buffer to Blob…', { bufferBytes: bufferFromJson!.byteLength });
        img = await put(imgPath, bufferFromJson!, {
          access: 'public',
          contentType: contentMime,
          addRandomSuffix: false,
        });
      }
    } catch (e) {
      err(rid, 'Blob put(original) failed:', (e as Error).message);
      return NextResponse.json({ error: 'Blob upload failed' }, { status: 500 });
    }
    log(rid, 'Blob put(original) OK', { url: img.url, ms: Date.now() - putStarted });

    // ---------- Save sidecar meta ----------
    const meta = {
      fileUrl: img.url,
      mime: contentMime,
      finalizedPrompt,
      createdAt: Date.now(),
      version: 1,
    };

    const metaPutStarted = Date.now();
    try {
      await put(metaPath, JSON.stringify(meta), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      });
    } catch (e) {
      err(rid, 'Blob put(meta) failed:', (e as Error).message);
      return NextResponse.json({ error: 'Meta upload failed' }, { status: 500 });
    }
    log(rid, 'Blob put(meta) OK', { ms: Date.now() - metaPutStarted });

    // ---------- Response ----------
    const metaUrl = img.url.replace(/original\.\w+$/, 'meta.json');
    const totalMs = Date.now() - startedAt;
    log(rid, 'SUCCESS', { totalMs, fileUrl: img.url, metaUrl });

    return NextResponse.json({
      imageId: id,
      fileUrl: img.url,
      metaUrl,
      _rid: rid,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    err(rid, 'UNCAUGHT ERROR', msg);
    return NextResponse.json({ error: msg, _rid: rid }, { status: 500 });
  }
}
