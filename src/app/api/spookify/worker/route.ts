// // export const runtime = 'nodejs';
// // export const dynamic = 'force-dynamic';

// // import { NextResponse } from 'next/server';
// // import { put } from '@vercel/blob';
// // import { getJob, updateJob, type SpookifyJobInput } from '@/lib/jobs';

// // const DEFAULT_PROMPT =
// //   'Tasteful Halloween version while preserving the composition; moody fog, moonlit ambience, warm candle glow; 1–3 soft white friendly ghosts; no text; printable; no gore.';

// // /* ---------------- logging helpers ---------------- */

// // const TAG = '[spookify-worker]';
// // const log = (...a: unknown[]) => console.log(TAG, ...a);
// // const warn = (...a: unknown[]) => console.warn(TAG, ...a);
// // const errlog = (...a: unknown[]) => console.error(TAG, ...a);

// // function safePreview(v: unknown, max = 800): string {
// //   try {
// //     const s = JSON.stringify(
// //       v,
// //       (_, val) => (typeof val === 'string' && val.length > 200 ? `${val.slice(0, 200)}…(${val.length})` : val),
// //       2
// //     );
// //     return s.length > max ? s.slice(0, max) + `…(${s.length})` : s;
// //   } catch {
// //     return String(v);
// //   }
// // }

// // function metaUrlFrom(imageId: string): string | null {
// //   const base = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/+$/, '');
// //   if (!base) return null;
// //   return `${base}/spookify/${encodeURIComponent(imageId)}/meta.json`;
// // }

// // type Meta = {
// //   fileUrl: string;
// //   bytes?: number;
// //   mime?: string;
// //   finalizedPrompt?: string;
// //   createdAt?: number;
// //   version?: number;
// // };

// // function isSpookifyJobInput(v: unknown): v is SpookifyJobInput {
// //   return !!v && typeof v === 'object' && typeof (v as SpookifyJobInput).imageId === 'string';
// // }

// // /* ---------------- aspect + target helpers ---------------- */
// // // helper near sanitizeTarget()
// // function pickImageSize(
// //   orientation?: 'Horizontal' | 'Vertical' | 'Square',
// //   wantBig = false
// // ): '1024x1024' | '2048x2048' | '1792x1024' | '1024x1792' {
// //   if (orientation === 'Horizontal') return '1792x1024';
// //   if (orientation === 'Vertical') return '1024x1792';
// //   return wantBig ? '2048x2048' : '1024x1024';
// // }

// // function sanitizeTarget(
// //   input?: SpookifyJobInput['target'],
// //   orientation?: 'Horizontal' | 'Vertical' | 'Square'
// // ) {
// //   log('sanitizeTarget.INPUT', { type: typeof input, inputPreview: safePreview(input), orientation });

// //   let aspect = input?.aspect;
// //   if (!(typeof aspect === 'number' && isFinite(aspect) && aspect > 0.2 && aspect < 5)) {
// //     if (orientation === 'Square') aspect = 1;
// //     else if (orientation === 'Horizontal') aspect = 1.4;
// //     else if (orientation === 'Vertical') aspect = 1 / 1.4;
// //     else aspect = undefined; // keep source aspect
// //   }

// //   const minWidth =
// //     typeof input?.minWidth === 'number' && isFinite(input?.minWidth)
// //       ? Math.max(1024, Math.min(12000, Math.round(input!.minWidth!)))
// //       : 2048; // sensible default

// //   const mode: 'cover' | 'contain' = input?.mode === 'contain' ? 'contain' : 'cover';
// //   const out = { aspect, minWidth, mode };
// //   log('sanitizeTarget.OUTPUT', out);
// //   return out;
// // }

// // /* ---------------- image adapter (Sharp → Jimp fallback) ---------------- */

// // type ImageAdapter = {
// //   name: 'sharp' | 'jimp';
// //   // Returns a JPEG buffer resized/cropped to requested target
// //   makeJpeg(
// //     pngOrJpgBuffer: Buffer,
// //     opts: { width: number; aspect?: number; mode: 'cover' | 'contain' }
// //   ): Promise<Buffer>;
// // };

// // async function loadAdapter(): Promise<ImageAdapter> {
// //   // Prefer Sharp (native, fast)
// //   try {
// //     const mod = await import('sharp');
// //     const sharp = mod.default;
// //     log('adapter: using sharp');

// //     const makeJpeg = async (
// //       inputBuffer: Buffer,
// //       opts: { width: number; aspect?: number; mode: 'cover' | 'contain' }
// //     ): Promise<Buffer> => {
// //       const img = sharp(inputBuffer);
// //       const meta = await img.metadata();
// //       log('sharp.meta', meta);

// //       const width = Math.max(1, Math.round(opts.width));
// //       if (!opts.aspect || !isFinite(opts.aspect)) {
// //         // Keep source aspect; scale "inside" to width
// //         const out = await img
// //           .resize({ width, fit: 'inside', withoutEnlargement: false })
// //           .jpeg({ quality: 82, mozjpeg: true, progressive: true })
// //           .toBuffer();
// //         return out;
// //       }

// //       const height = Math.max(1, Math.round(width / opts.aspect));
// //       const out = await img
// //         .resize({
// //           width,
// //           height,
// //           fit: opts.mode === 'contain' ? 'contain' : 'cover',
// //           position: 'entropy',
// //           background: opts.mode === 'contain' ? { r: 255, g: 255, b: 255, alpha: 1 } : undefined,
// //           withoutEnlargement: false,
// //         })
// //         .jpeg({ quality: 82, mozjpeg: true, progressive: true })
// //         .toBuffer();

// //       return out;
// //     };

// //     return { name: 'sharp', makeJpeg };
// //   } catch (e) {
// //     warn('sharp unavailable, falling back to jimp:', (e as Error)?.message || e);
// //   }

// //   // ---- Jimp fallback ----
// //   type JimpImage = {
// //     bitmap: { width: number; height: number };
// //     resize:
// //       | ((w: number, h: number) => JimpImage)
// //       | ((opts: { w: number; h: number }) => JimpImage);
// //     crop:
// //       | ((x: number, y: number, w: number, h: number) => JimpImage)
// //       | ((opts: { x: number; y: number; w: number; h: number }) => JimpImage);
// //     clone: () => JimpImage;
// //     composite: (src: JimpImage, x: number, y: number) => JimpImage;
// //     getBuffer?: (mime: string, cb: (err: unknown, data: Buffer) => void) => unknown;
// //     getBufferAsync?: (mime: string) => Promise<Buffer>;
// //   };
// //   type JimpCtor = {
// //     new (opts: { width: number; height: number; background?: number | string }): JimpImage;
// //     read: (buf: Buffer | string) => Promise<JimpImage>;
// //     MIME_JPEG?: string;
// //   };

// //   const jimpMod: unknown = await import('jimp');
// //   const ns = jimpMod as { default?: unknown; Jimp?: unknown };
// //   const Jimp = (ns.Jimp ?? ns.default ?? ns) as JimpCtor;
// //   const JPEG_MIME = (Jimp?.MIME_JPEG as string | undefined) ?? 'image/jpeg';

// //   const isPromise = <T,>(v: unknown): v is Promise<T> =>
// //     typeof v === 'object' && v !== null && 'then' in v && typeof (v as { then: unknown }).then === 'function';

// //   const getBufferCompat = async (img: JimpImage, mime: string) => {
// //     if (typeof (img as any).getBufferAsync === 'function') return (img as any).getBufferAsync(mime);
// //     if (typeof img.getBuffer === 'function') {
// //       return new Promise<Buffer>((resolve, reject) => {
// //         try {
// //           const maybe = img.getBuffer!(mime, (err, data) => (err ? reject(err) : resolve(data)));
// //           if (isPromise<Buffer>(maybe)) maybe.then(resolve).catch(reject);
// //         } catch (err) {
// //           reject(err);
// //         }
// //       });
// //     }
// //     throw new Error('Jimp: no getBuffer{Async} method available');
// //   };

// //   const resizeCompat = (img: JimpImage, w: number, h: number): JimpImage => {
// //     try {
// //       return (img.resize as (opts: { w: number; h: number }) => JimpImage)({ w, h });
// //     } catch {
// //       return (img.resize as (w: number, h: number) => JimpImage)(w, h);
// //     }
// //   };

// //   const cropCompat = (img: JimpImage, x: number, y: number, w: number, h: number): JimpImage => {
// //     try {
// //       return (img.crop as (opts: { x: number; y: number; w: number; h: number }) => JimpImage)({
// //         x,
// //         y,
// //         w,
// //         h,
// //       });
// //     } catch {
// //       return (img.crop as (x: number, y: number, w: number, h: number) => JimpImage)(x, y, w, h);
// //     }
// //   };

// //   log('adapter: using jimp');

// //   const makeJpeg = async (
// //     inputBuffer: Buffer,
// //     opts: { width: number; aspect?: number; mode: 'cover' | 'contain' }
// //   ): Promise<Buffer> => {
// //     const img = await Jimp.read(inputBuffer);
// //     const srcW = img.bitmap.width;
// //     const srcH = img.bitmap.height;
// //     const width = Math.max(1, Math.round(opts.width));

// //     if (!opts.aspect || !isFinite(opts.aspect)) {
// //       // keep source aspect, scale to width
// //       const h = Math.round((srcH / srcW) * width);
// //       resizeCompat(img, width, h);
// //       return await getBufferCompat(img as any, JPEG_MIME);
// //     }

// //     const height = Math.max(1, Math.round(width / opts.aspect));
// //     const srcAspect = srcW / srcH;
// //     const tgtAspect = width / height;

// //     if (opts.mode === 'contain') {
// //       const clone = img.clone();
// //       if (srcAspect > tgtAspect) {
// //         const h = Math.round(width / srcAspect);
// //         resizeCompat(clone, width, h);
// //         const canvas = new Jimp({ width, height, background: 0xffffffff });
// //         const top = Math.round((height - h) / 2);
// //         canvas.composite(clone, 0, top);
// //         return await getBufferCompat(canvas as any, JPEG_MIME);
// //       } else {
// //         const w = Math.round(height * srcAspect);
// //         resizeCompat(clone, w, height);
// //         const canvas = new Jimp({ width, height, background: 0xffffffff });
// //         const left = Math.round((width - w) / 2);
// //         canvas.composite(clone, left, 0);
// //         return await getBufferCompat(canvas as any, JPEG_MIME);
// //       }
// //     } else {
// //       // cover: crop then resize
// //       let cropW = srcW;
// //       let cropH = srcH;
// //       if (srcAspect > tgtAspect) {
// //         cropH = srcH;
// //         cropW = Math.round(cropH * tgtAspect);
// //       } else {
// //         cropW = srcW;
// //         cropH = Math.round(cropW / tgtAspect);
// //       }
// //       const left = Math.max(0, Math.round((srcW - cropW) / 2));
// //       const top = Math.max(0, Math.round((srcH - cropH) / 2));
// //       cropCompat(img, left, top, cropW, cropH);
// //       resizeCompat(img, width, height);
// //       return await getBufferCompat(img as any, JPEG_MIME);
// //     }
// //   };

// //   return { name: 'jimp', makeJpeg };
// // }

// // /* ---------------- route ---------------- */

// // export async function POST(req: Request) {
// //   const startTs = Date.now();
// //   let jobId = '';
// //   try {
// //     const bodyText = await req.text();
// //     log('POST body raw', bodyText);
// //     const body = bodyText ? (JSON.parse(bodyText) as { id?: string }) : {};

// //     jobId = body?.id ?? '';
// //     if (!jobId) {
// //       const msg = 'Missing job id in POST body';
// //       errlog(msg);
// //       return NextResponse.json({ error: msg }, { status: 400 });
// //     }

// //     const job = await getJob(jobId);
// //     log('job.lookup', { found: !!job, id: jobId });
// //     if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

// //     await updateJob(jobId, { status: 'processing' });

// //     const ji = job.input as unknown;
// //     log('job.input typeof', typeof ji);
// //     log('job.input preview', safePreview(ji));
// //     if (typeof ji !== 'object' || ji === null || Array.isArray(ji)) {
// //       const msg = `Worker expected object for job.input, got: ${typeof ji}`;
// //       errlog(msg, 'VALUE=', ji);
// //       await updateJob(jobId, { status: 'error', error: msg });
// //       return NextResponse.json({ error: msg }, { status: 400 });
// //     }

// //     if (!isSpookifyJobInput(ji)) {
// //       const msg = 'Job input missing imageId';
// //       errlog(msg, 'job.input=', safePreview(ji));
// //       await updateJob(jobId, { status: 'error', error: msg });
// //       return NextResponse.json({ error: msg }, { status: 400 });
// //     }

// //     const input = ji as SpookifyJobInput;
// //     log('input.keys', Object.keys(input));

// //     const imageId = input.imageId;
// //     const promptOverride = input.promptOverride ?? null;
// //     const { aspect, minWidth, mode } = sanitizeTarget(input.target, input.orientation ?? undefined);

// //     // 1) meta.json → original URL
// //     const metaUrl = metaUrlFrom(imageId);
// //     log('meta.url', metaUrl);
// //     if (!metaUrl) {
// //       const msg = 'Missing NEXT_PUBLIC_BLOB_BASE_URL for meta lookup';
// //       errlog(msg);
// //       await updateJob(jobId, { status: 'error', error: msg });
// //       return NextResponse.json({ error: msg }, { status: 500 });
// //     }

// //     const metaRes = await fetch(metaUrl, { cache: 'no-store' });
// //     const metaText = await metaRes.clone().text().catch(() => '');
// //     log('meta.fetch.status', metaRes.status, metaRes.statusText);
// //     log('meta.fetch.bodyPreview', metaText.slice(0, 400));

// //     if (!metaRes.ok) {
// //       const msg = `Original not found (meta missing): ${metaRes.status}`;
// //       errlog(msg);
// //       await updateJob(jobId, { status: 'error', error: msg });
// //       return NextResponse.json({ error: msg }, { status: 404 });
// //     }
// //     const meta = (await metaRes.json()) as Meta;
// //     log('meta.parsed', safePreview(meta));
// //     const fileUrl = meta.fileUrl;
// //     if (!fileUrl) {
// //       const msg = 'Original not found (no fileUrl)';
// //       errlog(msg, 'meta=', safePreview(meta));
// //       await updateJob(jobId, { status: 'error', error: msg });
// //       return NextResponse.json({ error: msg }, { status: 404 });
// //     }

// //     // 2) fetch original
// //     const imgRes = await fetch(fileUrl, { cache: 'no-store' });
// //     const imgStatus = { status: imgRes.status, text: imgRes.statusText };
// //     log('image.fetch.status', imgStatus);

// //     if (!imgRes.ok) {
// //       const raw = await imgRes.text().catch(() => '');
// //       const msg = `Could not fetch original: ${raw || imgRes.statusText}`;
// //       errlog(msg);
// //       await updateJob(jobId, { status: 'error', error: msg });
// //       return NextResponse.json({ error: msg }, { status: 400 });
// //     }

// //     const srcArrayBuf = await imgRes.arrayBuffer();
// //     log('image.bytes', srcArrayBuf.byteLength);
// //     // Set mime to jpeg to match common original uploads
// //     const srcBlob = new Blob([srcArrayBuf], { type: 'image/jpeg' });

// //     // 3) prompt
// //     const prompt =
// //       (promptOverride && promptOverride.trim()) ||
// //       (meta.finalizedPrompt && meta.finalizedPrompt.trim()) ||
// //       DEFAULT_PROMPT;
// //     log('prompt.len', prompt.length);
// //     log('prompt.preview', prompt.slice(0, 200));

// //     const apiKey = process.env.OPENAI_API_KEY;
// //     if (!apiKey) {
// //       const msg = 'Missing OPENAI_API_KEY';
// //       errlog(msg);
// //       await updateJob(jobId, { status: 'error', error: msg });
// //       return NextResponse.json({ error: msg }, { status: 503 });
// //     }

// //     const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
// //     if (!blobToken) {
// //       const msg = 'Missing BLOB_READ_WRITE_TOKEN';
// //       errlog(msg);
// //       await updateJob(jobId, { status: 'error', error: msg });
// //       return NextResponse.json({ error: msg }, { status: 503 });
// //     }
// //  // pick a size based on orientation
// // const size = pickImageSize(input.orientation ?? undefined, (minWidth ?? 0) >= 1792);

// // // Build initial form
// // const form = new FormData();
// // form.append('model', 'gpt-image-1');
// // form.append('prompt', prompt);
// // form.append('size', size);
// // form.append('quality', 'high');
// // form.append('image', srcBlob, 'source.jpg');

// // log('openai.request', { model: 'gpt-image-1', size, quality: 'high' });

// // const url = 'https://api.openai.com/v1/images/edits';
// // const headers = { Authorization: `Bearer ${apiKey}` };

// // // Helper to clone a FormData (FormData(form) does NOT work)
// // function cloneFormData(src: FormData) {
// //   const fd = new FormData();
// //   for (const [k, v] of src.entries()) fd.append(k, v as any);
// //   return fd;
// // }

// // let resp = await fetch(url, { method: 'POST', headers, body: form });

// // if (!resp.ok) {
// //   const bodyText = await resp.text().catch(() => '');
// //   const lower = bodyText.toLowerCase();

// //   // Fallback only for size-related errors
// //   if (lower.includes('size')) {
// //     const squareForm = cloneFormData(form);
// //     squareForm.set('size', (minWidth ?? 0) >= 1792 ? '2048x2048' : '1024x1024');
// //     squareForm.set(
// //       'prompt',
// //       `${prompt}\n\nFraming: ${
// //         input.orientation === 'Horizontal'
// //           ? 'wider'
// //           : input.orientation === 'Vertical'
// //           ? 'taller'
// //           : 'centered'
// //       } composition, keep full head in frame.`
// //     );

// //     resp = await fetch(url, { method: 'POST', headers, body: squareForm });
// //   } else {
// //     const maybeSafety =
// //       resp.status === 400 ||
// //       lower.includes('safety') ||
// //       lower.includes('violence') ||
// //       lower.includes('policy') ||
// //       lower.includes('content');

// //     const msg = maybeSafety
// //       ? 'Prompt rejected by safety system — try a gentler description (no gore/violence).'
// //       : `Image generation failed: ${bodyText || resp.statusText}`;

// //     errlog('openai.error', { status: resp.status, preview: bodyText.slice(0, 600) });
// //     await updateJob(jobId, { status: 'error', error: msg });
// //     return NextResponse.json({ error: msg }, { status: 400 });
// //   }
// // }

// // // From here on, resp is OK (either first try or fallback)
// // // Read the body once and parse
// // const textRaw = await resp.text();
// // log('openai.body.len', textRaw.length);
// // log('openai.body.preview', textRaw.slice(0, 300), '…', textRaw.slice(-120));


// //     let json: { data?: Array<{ b64_json?: string }> };
// //     try {
// //       json = JSON.parse(textRaw);
// //     } catch (e) {
// //       const msg = `OpenAI returned non-JSON: ${(e as Error)?.message}`;
// //       errlog(msg);
// //       await updateJob(jobId, { status: 'error', error: msg });
// //       return NextResponse.json({ error: msg }, { status: 500 });
// //     }

// //     const b64 = json?.data?.[0]?.b64_json;
// //     if (!b64) {
// //       const msg = 'Image edit returned no data';
// //       errlog(msg, 'json=', safePreview(json));
// //       await updateJob(jobId, { status: 'error', error: msg });
// //       return NextResponse.json({ error: msg }, { status: 500 });
// //     }
// //     log('openai.image.b64.len', b64.length);

// //     // 5) Conform to requested aspect/size & emit JPEGs
// //     const squareImg = Buffer.from(b64, 'base64'); // PNG/JPG buffer from API
// //     const adapter = await loadAdapter();

// //     const fullWidth = Math.max(1024, minWidth ?? 2048);
// //     const previewWidth = 1280;

// //     log('conform.target', { aspect, mode, fullWidth, previewWidth });

// //     const fullJpeg = await adapter.makeJpeg(squareImg, { width: fullWidth, aspect, mode });
// //     // scale preview from the same source (not from full to keep sharpness consistent)
// //     const previewJpeg = await adapter.makeJpeg(squareImg, { width: previewWidth, aspect, mode });

// //     log('jpeg.sizes', { full: fullJpeg.byteLength, preview: previewJpeg.byteLength });

// //     // 6) Upload both to Blob storage
// //     const preview = await put(`spookify/${imageId}/result-preview.jpg`, previewJpeg, {
// //       access: 'public',
// //       contentType: 'image/jpeg',
// //       addRandomSuffix: false,
// //       token: blobToken,
// //       // cacheControl: 'public, max-age=31536000, immutable',
// //       cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year
// //     });

// //     const full = await put(`spookify/${imageId}/result-full.jpg`, fullJpeg, {
// //       access: 'public',
// //       contentType: 'image/jpeg',
// //       addRandomSuffix: false,
// //       token: blobToken,
// //       // cacheControl: 'public, max-age=31536000, immutable',
// //       cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year
// //     });

// //     // 7) Persist job result
// //     await updateJob(jobId, {
// //       status: 'done',
// //       resultUrl: preview.url,
// //       // keep a separate field for full-res to use on products/checkout
// //       resultFullUrl: (full as any).url ?? full.url, // typing nicety
// //       error: null,
// //       input: { ...input, target: { aspect, minWidth: fullWidth, mode } } as SpookifyJobInput,
// //     });

// //     log('DONE', { ms: Date.now() - startTs, jobId, adapter: adapter.name });
// //     return NextResponse.json({
// //       ok: true,
// //       jobId,
// //       resultUrl: preview.url,
// //       resultFullUrl: full.url,
// //     });
// //   } catch (err: unknown) {
// //     const msg = err instanceof Error ? err.message : String(err);
// //     errlog('FATAL', msg);
// //     console.error('[spookify-worker] FATAL full', err);
// //     if (jobId) await updateJob(jobId, { status: 'error', error: msg });
// //     return NextResponse.json({ error: msg }, { status: 500 });
// //   }
// // }
// // src/app/api/spookify/worker/route.ts
// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// import { NextResponse } from 'next/server';
// import { put } from '@vercel/blob';
// import { getJob, updateJob, type SpookifyJobInput } from '@/lib/jobs';

// const DEFAULT_PROMPT =
//   'Tasteful Halloween version while preserving the composition; moody fog, moonlit ambience, warm candle glow; 1–3 soft white friendly ghosts; no text; printable; no gore.';

// const TAG = '[spookify-worker]';
// const log = (...a: unknown[]) => console.log(TAG, ...a);
// const warn = (...a: unknown[]) => console.warn(TAG, ...a);
// const errlog = (...a: unknown[]) => console.error(TAG, ...a);

// function safePreview(v: unknown, max = 800): string {
//   try {
//     const s = JSON.stringify(
//       v,
//       (_, val) => (typeof val === 'string' && val.length > 200 ? `${val.slice(0, 200)}…(${val.length})` : val),
//       2
//     );
//     return s.length > max ? s.slice(0, max) + `…(${s.length})` : s;
//   } catch {
//     return String(v);
//   }
// }

// function metaUrlFrom(imageId: string): string | null {
//   const base = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/+$/, '');
//   if (!base) return null;
//   return `${base}/spookify/${encodeURIComponent(imageId)}/meta.json`;
// }

// type Meta = {
//   fileUrl: string;
//   bytes?: number;
//   mime?: string;
//   finalizedPrompt?: string;
//   createdAt?: number;
//   version?: number;
// };

// function isSpookifyJobInput(v: unknown): v is SpookifyJobInput {
//   return !!v && typeof v === 'object' && typeof (v as SpookifyJobInput).imageId === 'string';
// }

// /* ---------------- size/orientation helpers ---------------- */

// function pickImageSize(
//   orientation?: 'Horizontal' | 'Vertical' | 'Square',
// ): '1024x1024' | '1024x1536' | '1536x1024' {
//   if (orientation === 'Horizontal') return '1536x1024';
//   if (orientation === 'Vertical') return '1024x1536';
//   return '1024x1024';
// }


// function sanitizeTarget(
//   input?: SpookifyJobInput['target'],
//   orientation?: 'Horizontal' | 'Vertical' | 'Square'
// ) {
//   log('sanitizeTarget.INPUT', { type: typeof input, inputPreview: safePreview(input), orientation });

//   let aspect = input?.aspect;
//   if (!(typeof aspect === 'number' && isFinite(aspect) && aspect > 0.2 && aspect < 5)) {
//     if (orientation === 'Square') aspect = 1;
//     else if (orientation === 'Horizontal') aspect = 1.4;
//     else if (orientation === 'Vertical') aspect = 1 / 1.4;
//     else aspect = undefined;
//   }

//   const minWidth =
//     typeof input?.minWidth === 'number' && isFinite(input?.minWidth)
//       ? Math.max(1024, Math.min(12000, Math.round(input!.minWidth!)))
//       : 2048;

//   const mode: 'cover' | 'contain' = input?.mode === 'contain' ? 'contain' : 'cover';
//   const out = { aspect, minWidth, mode };
//   log('sanitizeTarget.OUTPUT', out);
//   return out;
// }

// /* ---------------- image adapter (Sharp → Jimp fallback) ---------------- */

// type ImageAdapter = {
//   name: 'sharp' | 'jimp';
//   // Returns a JPEG buffer resized/cropped to requested target
//   makeJpeg(
//     pngOrJpgBuffer: Buffer,
//     opts: { width: number; aspect?: number; mode: 'cover' | 'contain' }
//   ): Promise<Buffer>;
// };

// async function loadAdapter(): Promise<ImageAdapter> {
//   // Prefer Sharp (native, fast)
//   try {
//     const mod = await import('sharp');
//     const sharp = mod.default;
//     log('adapter: using sharp');

//     const makeJpeg = async (
//       inputBuffer: Buffer,
//       opts: { width: number; aspect?: number; mode: 'cover' | 'contain' }
//     ): Promise<Buffer> => {
//       const img = sharp(inputBuffer);
//       const meta = await img.metadata();
//       log('sharp.meta', meta);

//       const width = Math.max(1, Math.round(opts.width));
//       if (!opts.aspect || !isFinite(opts.aspect)) {
//         return img
//           .resize({ width, fit: 'inside', withoutEnlargement: false })
//           .jpeg({ quality: 82, mozjpeg: true, progressive: true })
//           .toBuffer();
//       }

//       const height = Math.max(1, Math.round(width / opts.aspect));
//       return img
//         .resize({
//           width,
//           height,
//           fit: opts.mode === 'contain' ? 'contain' : 'cover',
//           position: 'entropy',
//           background: opts.mode === 'contain' ? { r: 255, g: 255, b: 255, alpha: 1 } : undefined,
//           withoutEnlargement: false,
//         })
//         .jpeg({ quality: 82, mozjpeg: true, progressive: true })
//         .toBuffer();
//     };

//     return { name: 'sharp', makeJpeg };
//   } catch (e) {
//     warn('sharp unavailable, falling back to jimp:', (e as Error)?.message || e);
//   }

//   // ---- Jimp fallback (typed) ----
//   type JimpImage = {
//     bitmap: { width: number; height: number };
//     resize: ((w: number, h: number) => JimpImage) | ((opts: { w: number; h: number }) => JimpImage);
//     crop:
//       | ((x: number, y: number, w: number, h: number) => JimpImage)
//       | ((opts: { x: number; y: number; w: number; h: number }) => JimpImage);
//     clone: () => JimpImage;
//     composite: (src: JimpImage, x: number, y: number) => JimpImage;
//     getBuffer?: (mime: string, cb: (err: unknown, data: Buffer) => void) => void;
//     getBufferAsync?: (mime: string) => Promise<Buffer>;
//   };
//   type JimpCtor = {
//     new (opts: { width: number; height: number; background?: number | string }): JimpImage;
//     read: (buf: Buffer | string) => Promise<JimpImage>;
//     MIME_JPEG?: string;
//   };

//   const jimpMod: unknown = await import('jimp');
//   const ns = jimpMod as { default?: unknown; Jimp?: unknown };
//   const Jimp = (ns.Jimp ?? ns.default ?? ns) as JimpCtor;
//   const JPEG_MIME = (Jimp?.MIME_JPEG as string | undefined) ?? 'image/jpeg';

//   const getBufferCompat = async (img: JimpImage, mime: string) => {
//     if (typeof img.getBufferAsync === 'function') return img.getBufferAsync(mime);
//     if (typeof img.getBuffer === 'function') {
//       return new Promise<Buffer>((resolve, reject) => {
//         try {
//           img.getBuffer!(mime, (err, data) => (err ? reject(err) : resolve(data)));
//         } catch (err) {
//           reject(err as Error);
//         }
//       });
//     }
//     throw new Error('Jimp: no getBuffer{Async} method available');
//   };

//   const resizeCompat = (img: JimpImage, w: number, h: number): JimpImage => {
//     try {
//       return (img.resize as (opts: { w: number; h: number }) => JimpImage)({ w, h });
//     } catch {
//       return (img.resize as (w: number, h: number) => JimpImage)(w, h);
//     }
//   };

//   const cropCompat = (img: JimpImage, x: number, y: number, w: number, h: number): JimpImage => {
//     try {
//       return (img.crop as (opts: { x: number; y: number; w: number; h: number }) => JimpImage)({
//         x,
//         y,
//         w,
//         h,
//       });
//     } catch {
//       return (img.crop as (x: number, y: number, w: number, h: number) => JimpImage)(x, y, w, h);
//     }
//   };

//   log('adapter: using jimp');

//   const makeJpeg = async (
//     inputBuffer: Buffer,
//     opts: { width: number; aspect?: number; mode: 'cover' | 'contain' }
//   ): Promise<Buffer> => {
//     const img = await Jimp.read(inputBuffer);
//     const srcW = img.bitmap.width;
//     const srcH = img.bitmap.height;
//     const width = Math.max(1, Math.round(opts.width));

//     if (!opts.aspect || !isFinite(opts.aspect)) {
//       const h = Math.round((srcH / srcW) * width);
//       resizeCompat(img, width, h);
//       return getBufferCompat(img, JPEG_MIME);
//     }

//     const height = Math.max(1, Math.round(width / opts.aspect));
//     const srcAspect = srcW / srcH;
//     const tgtAspect = width / height;

//     if (opts.mode === 'contain') {
//       const clone = img.clone();
//       if (srcAspect > tgtAspect) {
//         const h = Math.round(width / srcAspect);
//         resizeCompat(clone, width, h);
//         const canvas = new Jimp({ width, height, background: 0xffffffff });
//         const top = Math.round((height - h) / 2);
//         canvas.composite(clone, 0, top);
//         return getBufferCompat(canvas, JPEG_MIME);
//       } else {
//         const w = Math.round(height * srcAspect);
//         resizeCompat(clone, w, height);
//         const canvas = new Jimp({ width, height, background: 0xffffffff });
//         const left = Math.round((width - w) / 2);
//         canvas.composite(clone, left, 0);
//         return getBufferCompat(canvas, JPEG_MIME);
//       }
//     } else {
//       let cropW = srcW;
//       let cropH = srcH;
//       if (srcAspect > tgtAspect) {
//         cropH = srcH;
//         cropW = Math.round(cropH * tgtAspect);
//       } else {
//         cropW = srcW;
//         cropH = Math.round(cropW / tgtAspect);
//       }
//       const left = Math.max(0, Math.round((srcW - cropW) / 2));
//       const top = Math.max(0, Math.round((srcH - cropH) / 2));
//       cropCompat(img, left, top, cropW, cropH);
//       resizeCompat(img, width, height);
//       return getBufferCompat(img, JPEG_MIME);
//     }
//   };

//   return { name: 'jimp', makeJpeg };
// }

// /* ---------------- route ---------------- */

// export async function POST(req: Request) {
//   const startTs = Date.now();
//   let jobId = '';
//   try {
//     const bodyText = await req.text();
//     log('POST body raw', bodyText);
//     const body = bodyText ? (JSON.parse(bodyText) as { id?: string }) : {};

//     jobId = body?.id ?? '';
//     if (!jobId) {
//       const msg = 'Missing job id in POST body';
//       errlog(msg);
//       return NextResponse.json({ error: msg }, { status: 400 });
//     }

//     const job = await getJob(jobId);
//     log('job.lookup', { found: !!job, id: jobId });
//     if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

//     await updateJob(jobId, { status: 'processing' });

//     const ji = job.input as unknown;
//     log('job.input typeof', typeof ji);
//     log('job.input preview', safePreview(ji));
//     if (typeof ji !== 'object' || ji === null || Array.isArray(ji)) {
//       const msg = `Worker expected object for job.input, got: ${typeof ji}`;
//       errlog(msg, 'VALUE=', ji);
//       await updateJob(jobId, { status: 'error', error: msg });
//       return NextResponse.json({ error: msg }, { status: 400 });
//     }

//     if (!isSpookifyJobInput(ji)) {
//       const msg = 'Job input missing imageId';
//       errlog(msg, 'job.input=', safePreview(ji));
//       await updateJob(jobId, { status: 'error', error: msg });
//       return NextResponse.json({ error: msg }, { status: 400 });
//     }

//     const input = ji as SpookifyJobInput;
//     log('input.keys', Object.keys(input));

//     const imageId = input.imageId;
//     const promptOverride = input.promptOverride ?? null;

//     const { aspect, minWidth, mode } = sanitizeTarget(input.target, input.orientation ?? undefined);

//     // 1) meta.json → original URL
//     const metaUrl = metaUrlFrom(imageId);
//     log('meta.url', metaUrl);
//     if (!metaUrl) {
//       const msg = 'Missing NEXT_PUBLIC_BLOB_BASE_URL for meta lookup';
//       errlog(msg);
//       await updateJob(jobId, { status: 'error', error: msg });
//       return NextResponse.json({ error: msg }, { status: 500 });
//     }

//     const metaRes = await fetch(metaUrl, { cache: 'no-store' });
//     const metaText = await metaRes.clone().text().catch(() => '');
//     log('meta.fetch.status', metaRes.status, metaRes.statusText);
//     log('meta.fetch.bodyPreview', metaText.slice(0, 400));

//     if (!metaRes.ok) {
//       const msg = `Original not found (meta missing): ${metaRes.status}`;
//       errlog(msg);
//       await updateJob(jobId, { status: 'error', error: msg });
//       return NextResponse.json({ error: msg }, { status: 404 });
//     }
//     const meta = (await metaRes.json()) as Meta;
//     log('meta.parsed', safePreview(meta));
//     const fileUrl = meta.fileUrl;
//     if (!fileUrl) {
//       const msg = 'Original not found (no fileUrl)';
//       errlog(msg, 'meta=', safePreview(meta));
//       await updateJob(jobId, { status: 'error', error: msg });
//       return NextResponse.json({ error: msg }, { status: 404 });
//     }

//     // 2) fetch original
//     const imgRes = await fetch(fileUrl, { cache: 'no-store' });
//     const imgStatus = { status: imgRes.status, text: imgRes.statusText };
//     log('image.fetch.status', imgStatus);

//     if (!imgRes.ok) {
//       const raw = await imgRes.text().catch(() => '');
//       const msg = `Could not fetch original: ${raw || imgRes.statusText}`;
//       errlog(msg);
//       await updateJob(jobId, { status: 'error', error: msg });
//       return NextResponse.json({ error: msg }, { status: 400 });
//     }

//     const srcArrayBuf = await imgRes.arrayBuffer();
//     log('image.bytes', srcArrayBuf.byteLength);
//     const srcBlob = new Blob([srcArrayBuf], { type: 'image/jpeg' });

//     // 3) prompt
//     const prompt =
//       (promptOverride && promptOverride.trim()) ||
//       (meta.finalizedPrompt && meta.finalizedPrompt.trim()) ||
//       DEFAULT_PROMPT;
//     log('prompt.len', prompt.length);
//     log('prompt.preview', prompt.slice(0, 200));

//     const apiKey = process.env.OPENAI_API_KEY;
//     if (!apiKey) {
//       const msg = 'Missing OPENAI_API_KEY';
//       errlog(msg);
//       await updateJob(jobId, { status: 'error', error: msg });
//       return NextResponse.json({ error: msg }, { status: 503 });
//     }

//     const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
//     if (!blobToken) {
//       const msg = 'Missing BLOB_READ_WRITE_TOKEN';
//       errlog(msg);
//       await updateJob(jobId, { status: 'error', error: msg });
//       return NextResponse.json({ error: msg }, { status: 503 });
//     }

//     const size = pickImageSize(input.orientation ?? undefined);

//     // 4) Generate edit
//     const form = new FormData();
//     form.append('model', 'gpt-image-1');
//     form.append('prompt', prompt);
//     form.append('size', size);
//     form.append('quality', 'high');
//     form.append('image', srcBlob, 'source.jpg');

//     log('openai.request', { model: 'gpt-image-1', size, quality: 'high' });

//     let resp = await fetch('https://api.openai.com/v1/images/edits', {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${apiKey}` },
//       body: form,
//     });

//     log('openai.status', resp.status, resp.statusText);

//     // Defensive fallback if size not supported by backend
//     if (!resp.ok) {
//       const txt = await resp.text().catch(() => '');
//       const lower = txt.toLowerCase();
//       if (lower.includes('size')) {
//         const form2 = new FormData();
//         form2.append('model', 'gpt-image-1');
//         form2.append('prompt', `${prompt}\n\nFraming: ${
//           input.orientation === 'Horizontal' ? 'wider' : input.orientation === 'Vertical' ? 'taller' : 'centered'
//         } composition, keep full head in frame.`);
//         form2.append('size', size);
//         form2.append('quality', 'high');
//         form2.append('image', srcBlob, 'source.jpg');

//         resp = await fetch('https://api.openai.com/v1/images/edits', {
//           method: 'POST',
//           headers: { Authorization: `Bearer ${apiKey}` },
//           body: form2,
//         });
//         log('openai.status(fallback)', resp.status, resp.statusText);
//       } else {
//         // Recreate the Response body so later logic can parse JSON path uniformly
//         resp = new Response(txt, { status: resp.status, statusText: resp.statusText });
//       }
//     }

//     if (!resp.ok) {
//       const text = await resp.text().catch(() => '');
//       const lower = text.toLowerCase();
//       const maybeSafety =
//         resp.status === 400 ||
//         lower.includes('safety') ||
//         lower.includes('violence') ||
//         lower.includes('policy') ||
//         lower.includes('content');

//       const msg = maybeSafety
//         ? 'Prompt rejected by safety system — try a gentler description (no gore/violence).'
//         : `Image generation failed: ${text || resp.statusText}`;

//       errlog('openai.error', { status: resp.status, preview: text.slice(0, 600) });
//       await updateJob(jobId, { status: 'error', error: msg });
//       return NextResponse.json({ error: msg }, { status: 400 });
//     }

//     const textRaw = await resp.text();
//     log('openai.body.len', textRaw.length);
//     log('openai.body.preview', textRaw.slice(0, 300), '…', textRaw.slice(-120));

//     let json: { data?: Array<{ b64_json?: string }> };
//     try {
//       json = JSON.parse(textRaw) as { data?: Array<{ b64_json?: string }> };
//     } catch (e) {
//       const msg = `OpenAI returned non-JSON: ${(e as Error)?.message}`;
//       errlog(msg);
//       await updateJob(jobId, { status: 'error', error: msg });
//       return NextResponse.json({ error: msg }, { status: 500 });
//     }

//     const b64 = json?.data?.[0]?.b64_json;
//     if (!b64) {
//       const msg = 'Image edit returned no data';
//       errlog(msg, 'json=', safePreview(json));
//       await updateJob(jobId, { status: 'error', error: msg });
//       return NextResponse.json({ error: msg }, { status: 500 });
//     }
//     log('openai.image.b64.len', b64.length);

//     // 5) Conform to requested aspect/size & emit JPEGs
//     const modelBuffer = Buffer.from(b64, 'base64'); // PNG/JPG buffer from API
//     const adapter = await loadAdapter();

//     const fullWidth = Math.max(1024, minWidth ?? 2048);
//     const previewWidth = 1280;

//     log('conform.target', { aspect, mode, fullWidth, previewWidth });

//     const fullJpeg = await adapter.makeJpeg(modelBuffer, { width: fullWidth, aspect, mode });
//     const previewJpeg = await adapter.makeJpeg(modelBuffer, { width: previewWidth, aspect, mode });

//     log('jpeg.sizes', { full: fullJpeg.byteLength, preview: previewJpeg.byteLength });

//     // 6) Upload both to Blob storage (no cacheControl option in current typings)
//     const previewPut = await put(`spookify/${imageId}/result-preview.jpg`, previewJpeg, {
//       access: 'public',
//       contentType: 'image/jpeg',
//       addRandomSuffix: false,
//       token: blobToken,
//     });

//     const fullPut = await put(`spookify/${imageId}/result-full.jpg`, fullJpeg, {
//       access: 'public',
//       contentType: 'image/jpeg',
//       addRandomSuffix: false,
//       token: blobToken,
//     });

//     // 7) Persist job result
//     await updateJob(jobId, {
//       status: 'done',
//       resultUrl: previewPut.url,
//       resultFullUrl: fullPut.url,
//       error: null,
//       input: { ...input, target: { aspect, minWidth: fullWidth, mode } } as SpookifyJobInput,
//     });

//     log('DONE', { ms: Date.now() - startTs, jobId, adapter: adapter.name });
//     return NextResponse.json({
//       ok: true,
//       jobId,
//       resultUrl: previewPut.url,
//       resultFullUrl: fullPut.url,
//     });
//   } catch (err: unknown) {
//     const msg = err instanceof Error ? err.message : String(err);
//     errlog('FATAL', msg);
//     if (jobId) await updateJob(jobId, { status: 'error', error: msg });
//     return NextResponse.json({ error: msg }, { status: 500 });
//   }
// }

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getJob, updateJob, type SpookifyJobInput } from '@/lib/jobs';

const DEFAULT_PROMPT =
  'Tasteful Halloween version while preserving the composition; moody fog, moonlit ambience, warm candle glow; 1–3 soft white friendly ghosts; no text; printable; no gore.';

const TAG = '[spookify-worker]';
const log = (...a: unknown[]) => console.log(TAG, ...a);
const errlog = (...a: unknown[]) => console.error(TAG, ...a);

/* ---------------- helpers ---------------- */

function safePreview(v: unknown, max = 800): string {
  try {
    const s = JSON.stringify(
      v,
      (_, val) =>
        typeof val === 'string' && val.length > 200
          ? `${val.slice(0, 200)}…(${val.length})`
          : val,
      2
    );
    return s.length > max ? s.slice(0, max) + `…(${s.length})` : s;
  } catch {
    return String(v);
  }
}

function metaUrlFrom(imageId: string): string | null {
  const base = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/+$/, '');
  if (!base) return null;
  return `${base}/spookify/${encodeURIComponent(imageId)}/meta.json`;
}

function isSpookifyJobInput(v: unknown): v is SpookifyJobInput {
  return !!v && typeof v === 'object' && typeof (v as SpookifyJobInput).imageId === 'string';
}

function pickImageSize(
  orientation?: 'Horizontal' | 'Vertical' | 'Square'
): '1024x1024' | '1024x1536' | '1536x1024' {
  if (orientation === 'Horizontal') return '1536x1024';
  if (orientation === 'Vertical') return '1024x1536';
  return '1024x1024';
}

/* ---------------- route ---------------- */

export async function POST(req: Request) {
  const start = Date.now();
  let jobId = '';

  try {
    const body = await req.json().catch(() => ({}));
    jobId = body?.id ?? '';
    if (!jobId) return NextResponse.json({ error: 'Missing job id' }, { status: 400 });

    const job = await getJob(jobId);
    log('job.lookup', { found: !!job, id: jobId });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    await updateJob(jobId, { status: 'processing' });

    const input = job.input as unknown;
    if (!isSpookifyJobInput(input)) {
      await updateJob(jobId, { status: 'error', error: 'Invalid job input' });
      return NextResponse.json({ error: 'Invalid job input' }, { status: 400 });
    }

    const { imageId, promptOverride, orientation } = input;

    // 1) Fetch meta
    const metaUrl = metaUrlFrom(imageId);
    if (!metaUrl)
      throw new Error('Missing NEXT_PUBLIC_BLOB_BASE_URL for meta lookup');

    const metaRes = await fetch(metaUrl, { cache: 'no-store' });
    if (!metaRes.ok)
      throw new Error(`Meta not found: ${metaRes.status} ${metaRes.statusText}`);

    const meta = await metaRes.json();
    log('meta.parsed', safePreview(meta));
    const fileUrl = meta.fileUrl;
    if (!fileUrl) throw new Error('Meta missing fileUrl');

    // 2) Fetch original image
    const imgRes = await fetch(fileUrl, { cache: 'no-store' });
    if (!imgRes.ok)
      throw new Error(`Could not fetch original: ${imgRes.statusText}`);

    const imgArrayBuf = await imgRes.arrayBuffer();
    log('image.bytes', imgArrayBuf.byteLength);
    const srcBlob = new Blob([imgArrayBuf], { type: 'image/jpeg' });

    // 3) Build prompt
    const prompt =
      (promptOverride && promptOverride.trim()) ||
      (meta.finalizedPrompt && meta.finalizedPrompt.trim()) ||
      DEFAULT_PROMPT;

    log('prompt.preview', prompt.slice(0, 200));

    const apiKey = process.env.OPENAI_API_KEY;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!apiKey || !blobToken)
      throw new Error('Missing OPENAI_API_KEY or BLOB_READ_WRITE_TOKEN');

    // 4) Generate via OpenAI
    const size = pickImageSize(orientation ?? undefined);
    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('prompt', prompt);
    form.append('size', size);
    form.append('quality', 'high');
    form.append('image', srcBlob, 'source.jpg');

    log('openai.request', { size });

    const resp = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      const lower = text.toLowerCase();
      const maybeSafety =
        lower.includes('safety') ||
        lower.includes('violence') ||
        lower.includes('policy') ||
        lower.includes('content');

      const msg = maybeSafety
        ? 'Prompt rejected by safety system — try a gentler description (no gore/violence).'
        : `Image generation failed: ${text || resp.statusText}`;
      errlog('openai.error', msg);
      await updateJob(jobId, { status: 'error', error: msg });
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const json = await resp.json();
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image data from OpenAI');

    const buffer = Buffer.from(b64, 'base64');

    // 5) Upload direct preview
    const key = `spookify/${imageId}/result-preview.jpg`;
    log('uploading', key);

    const uploaded = await put(key, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
      token: blobToken,
    });

    // 6) Save job + return
    await updateJob(jobId, {
      status: 'done',
      resultUrl: uploaded.url,
      error: null,
      input: { ...input },
    });

    log('DONE', { ms: Date.now() - start, jobId });
    return NextResponse.json({
      ok: true,
      jobId,
      resultUrl: uploaded.url,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errlog('FATAL', msg);
    if (jobId) await updateJob(jobId, { status: 'error', error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

