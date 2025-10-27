// // // src/app/api/upload-original/route.ts
// // import { NextRequest, NextResponse } from 'next/server'
// // import { put } from '@vercel/blob'
// // import crypto from 'node:crypto'

// // export const runtime = 'nodejs'
// // export const dynamic = 'force-dynamic'

// // export async function POST(req: NextRequest) {
// //   try {
// //     const form = await req.formData()
// //     const file = form.get('file') as File | null
// //     const finalizedPrompt = (form.get('finalizedPrompt') as string) || ''
// //     if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

// //     const id = crypto.randomUUID()
// //     const ext = file.type === 'image/png' ? 'png' : 'jpg'
// //     const base = `spookify/${id}`
// //     const imgPath = `${base}/original.${ext}`
// //     const metaPath = `${base}/meta.json`

// //     // Save the original (public so OpenAI/Gelato can fetch it)
// //     const img = await put(imgPath, file.stream(), {
// //       access: 'public',
// //       contentType: file.type || 'image/jpeg',
// //       addRandomSuffix: false,
// //     })

// //     // Save a sidecar metadata file next to it
// //     const meta = {
// //       fileUrl: img.url,
// //       bytes: file.size,
// //       mime: file.type || 'image/jpeg',
// //       finalizedPrompt,
// //       createdAt: Date.now(),
// //       version: 1,
// //     }
// //     await put(metaPath, JSON.stringify(meta), {
// //       access: 'public',
// //       contentType: 'application/json',
// //       addRandomSuffix: false,
// //     })

// //     // Return both ids + canonical URLs
// //     return NextResponse.json({
// //       imageId: id,
// //       fileUrl: img.url,
// //       metaUrl: img.url.replace(/original\.\w+$/, 'meta.json'),
// //     })
// //   } catch (e) {
// //     const msg = e instanceof Error ? e.message : String(e)
// //     return NextResponse.json({ error: msg }, { status: 500 })
// //   }
// // }
// // src/app/api/upload-original/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { put } from '@vercel/blob';
// import crypto from 'node:crypto';

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// function dataUrlToParts(dataUrl: string): { mime: string; buf: Buffer } {
//   const m = dataUrl.match(/^data:(?<mime>image\/[a-z0-9+.\-]+);base64,(?<b64>.+)$/i);
//   if (!m?.groups?.mime || !m?.groups?.b64) throw new Error('Bad data URL');
//   return { mime: m.groups.mime, buf: Buffer.from(m.groups.b64, 'base64') };
// }

// export async function POST(req: NextRequest) {
//   try {
//     const ctype = req.headers.get('content-type') || '';

//     let file: File | null = null;
//     let finalizedPrompt = '';
//     let mimeFromJson: string | null = null;
//     let filenameFromJson: string | null = null;
//     let arrayBufFromJson: ArrayBuffer | null = null;

//     // ---- Branch 1: multipart/form-data (preferred) ----
//     if (ctype.startsWith('multipart/form-data')) {
//       const form = await req.formData();
//       const f = form.get('file');
//       if (f instanceof File) file = f;
//       finalizedPrompt = (form.get('finalizedPrompt') as string) || '';
//     }

//     // ---- Branch 2: application/json with { dataUrl, filename } ----
//     if (!file && ctype.includes('application/json')) {
//       const body = (await req.json().catch(() => null)) as
//         | { dataUrl?: string; filename?: string; finalizedPrompt?: string }
//         | null;

//       if (body?.dataUrl) {
//         const { mime, buf } = dataUrlToParts(body.dataUrl);
//         mimeFromJson = mime;
//         filenameFromJson = body.filename || `upload-${Date.now()}.jpg`;
//         arrayBufFromJson = buf;
//         finalizedPrompt = (body.finalizedPrompt || '').trim();
//       }
//     }

//     if (!file && !arrayBufFromJson) {
//       return NextResponse.json({ error: 'No file or dataUrl provided' }, { status: 400 });
//     }

//     // ---- Persist to Vercel Blob ----
//     const id = crypto.randomUUID();
//     const ext =
//       (file?.type || mimeFromJson || 'image/jpeg').includes('png') ? 'png' : 'jpg';
//     const base = `spookify/${id}`;
//     const imgPath = `${base}/original.${ext}`;
//     const metaPath = `${base}/meta.json`;

//     // Upload image
//     const img = await (async () => {
//       if (file) {
//         return put(imgPath, file.stream(), {
//           access: 'public',
//           contentType: file.type || 'image/jpeg',
//           addRandomSuffix: false,
//         });
//       }
//       // JSON path
//       return put(imgPath, arrayBufFromJson!, {
//         access: 'public',
//         contentType: mimeFromJson || 'image/jpeg',
//         addRandomSuffix: false,
//       });
//     })();

//     // Upload metadata
//     const bytes = file?.size ?? (arrayBufFromJson ? arrayBufFromJson.byteLength : 0);
//     const mime = file?.type || mimeFromJson || 'image/jpeg';

//     const meta = {
//       fileUrl: img.url,
//       bytes,
//       mime,
//       finalizedPrompt,
//       createdAt: Date.now(),
//       version: 1,
//     };

//     await put(metaPath, JSON.stringify(meta), {
//       access: 'public',
//       contentType: 'application/json',
//       addRandomSuffix: false,
//     });

//     return NextResponse.json({
//       imageId: id,
//       fileUrl: img.url,
//       metaUrl: img.url.replace(/original\.\w+$/, 'meta.json'),
//     });
//   } catch (e) {
//     const msg = e instanceof Error ? e.message : String(e);
//     return NextResponse.json({ error: msg }, { status: 500 });
//   }
// }
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

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // ---- Inputs we'll fill from either branch (multipart OR json) ----
    let fileExt: 'png' | 'jpg' = 'jpg';
    let contentMime = 'image/jpeg';
    let finalizedPrompt = '';

    // Exactly one of these will be defined:
    let streamFromForm: ReadableStream<Uint8Array> | null = null;
    let bufferFromJson: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      // ---------- multipart/form-data ----------
      const form = await req.formData();
      const file = form.get('file') as File | null;
      finalizedPrompt = (form.get('finalizedPrompt') as string) || '';
      if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

      contentMime = file.type || 'image/jpeg';
      fileExt = contentMime === 'image/png' ? 'png' : 'jpg';
      streamFromForm = file.stream();

      // NOTE: we don’t need the original filename for the canonical path
      // (id controls the path to keep things predictable).
    } else if (contentType.includes('application/json')) {
      // ---------- JSON body with dataUrl ----------
      const body = (await req.json()) as JsonBody;
      if (!body?.dataUrl) {
        return NextResponse.json({ error: 'Missing dataUrl' }, { status: 400 });
      }
      const { mime, buf } = dataUrlToParts(body.dataUrl);
      contentMime = mime || 'image/jpeg';
      fileExt = contentMime === 'image/png' ? 'png' : 'jpg';
      bufferFromJson = buf;
      finalizedPrompt = (body.finalizedPrompt || '').trim();
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 415 });
    }

    // ---------- Canonical paths ----------
    const id = crypto.randomUUID();
    const base = `spookify/${id}`;
    const imgPath = `${base}/original.${fileExt}`;
    const metaPath = `${base}/meta.json`;

    // ---------- Save original ----------
    const img = await (async () => {
      if (streamFromForm) {
        // multipart path
        return put(imgPath, streamFromForm, {
          access: 'public',
          contentType: contentMime,
          addRandomSuffix: false,
        });
      }
      // JSON path (Buffer) — this fixes the ArrayBuffer type issue
      return put(imgPath, bufferFromJson!, {
        access: 'public',
        contentType: contentMime,
        addRandomSuffix: false,
      });
    })();

    // ---------- Save sidecar meta ----------
    const meta = {
      fileUrl: img.url,
      // We don’t know size reliably for form stream here without buffering; omit or compute client-side.
      mime: contentMime,
      finalizedPrompt,
      createdAt: Date.now(),
      version: 1,
    };

    await put(metaPath, JSON.stringify(meta), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });

    // ---------- Response ----------
    return NextResponse.json({
      imageId: id,
      fileUrl: img.url,
      metaUrl: img.url.replace(/original\.\w+$/, 'meta.json'),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
