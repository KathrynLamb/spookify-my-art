// app/api/spookify/worker/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  getJob,
  updateJob,
  createJob,
  type SpookifyJobInput,
  type SpookifyJob,
} from "@/lib/jobs";

/* ---------------- Types ---------------- */
type JobInput = SpookifyJobInput & {
  userId?: string | null;
  title?: string | null;
};

type WorkerBody = {
  id?: string;
  input?: JobInput;
};

type MetaJson = {
  fileUrl?: string;
  finalizedPrompt?: string | null;
};

/* ---------------- Constants ---------------- */
const DEFAULT_PROMPT =
  "Tasteful Halloween version while preserving the composition; moody fog, moonlit ambience, warm candle glow; 1–3 soft white friendly ghosts; no text; printable; no gore.";

const TAG = "[spookify-worker]";
const log = (...a: unknown[]) => console.log(TAG, ...a);
const errlog = (...a: unknown[]) => console.error(TAG, ...a);

/* ---------------- Helpers ---------------- */
function metaUrlFrom(imageId: string): string | null {
  const base = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/+$/, "");
  if (!base) return null;
  return `${base}/spookify/${encodeURIComponent(imageId)}/meta.json`;
}

function isSpookifyJobInput(v: unknown): v is SpookifyJobInput {
  return !!v && typeof v === "object" && typeof (v as SpookifyJobInput).imageId === "string";
}

function pickImageSize(
  orientation?: "Horizontal" | "Vertical" | "Square"
): "1024x1024" | "1024x1536" | "1536x1024" {
  if (orientation === "Horizontal") return "1536x1024";
  if (orientation === "Vertical") return "1024x1536";
  return "1024x1024";
}

/* Simple health probe */
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/spookify/worker" });
}

/* ---------------- Route ---------------- */
export async function POST(req: Request) {
  const start = Date.now();
  const mark = (label: string) => log(`${label.padEnd(20)} +${Date.now() - start}ms`);

  mark("worker.start");
  let jobId = "";

  try {
    // Heavy deps – load only when invoked
    // const { Jimp } = await import("jimp");
    // const Jimp = (await import("jimp")).default;
    // ✅ Correct: Jimp is the default export



    // Parse body (id + optional input fallback)
    const bodyJson = (await req.json().catch(() => ({}))) as WorkerBody;
    jobId = bodyJson?.id?.trim() ?? "";
    if (!jobId) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

    // Try KV / memory first
    let job = await getJob(jobId);
    mark("job.lookup");

    let input: JobInput | null = null;

    if (!job) {
      // Fallback: hot-reload may have nuked memory store in dev.
      const maybeInput = bodyJson.input;
      if (isSpookifyJobInput(maybeInput)) {
        input = maybeInput as JobInput;

        // Re-hydrate a minimal job so /status keeps working
        const now = Date.now();
        const shadowJob: SpookifyJob = {
          id: jobId,
          status: "processing",
          input,
          resultUrl: null,
          previewUrl: null,
          resultFullUrl: null,
          error: null,
          createdAt: now,
          updatedAt: now,
        };
        await createJob(shadowJob);
        job = shadowJob;
        mark("job.rehydrated");
      } else {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
    } else {
      await updateJob(jobId, { status: "processing" });
      const raw = job.input as unknown;
      if (!isSpookifyJobInput(raw)) {
        await updateJob(jobId, { status: "error", error: "Invalid job input" });
        return NextResponse.json({ error: "Invalid job input" }, { status: 400 });
      }
      input = raw as JobInput;
    }

    // Input is guaranteed now
    const { imageId, promptOverride, orientation, userId, title } = input!;

    /* ------------- Step 1: (Lazy) Firestore project create ------------- */
    // Avoid initializing Admin SDK at build time: import only when needed.
    const FIRESTORE_ENABLED = process.env.FIRESTORE_ENABLED === "1";
    let adminDb: import("firebase-admin/firestore").Firestore | null = null;
    
    if (FIRESTORE_ENABLED && userId) {
      try {
        const m = await import("@/lib/firebase/admin");
        adminDb = m.adminDb;
        await adminDb
          .collection("users")
          .doc(userId)
          .collection("projects")
          .doc(jobId)
          .set(
            {
              title: title || "Untitled Spookify Project",
              status: "processing",
              imageId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
      } catch (e) {
        // Don’t fail the job just because Firestore isn’t available
        console.warn(`${TAG} Firestore init/set failed (non-blocking)`, e);
      }
    }

    /* ------------- Step 2: Fetch meta ------------- */
    const metaUrl = metaUrlFrom(imageId);
    if (!metaUrl) throw new Error("Missing NEXT_PUBLIC_BLOB_BASE_URL for meta lookup");

    const metaRes = await fetch(metaUrl, { cache: "no-store" });
    if (!metaRes.ok) throw new Error(`Meta not found: ${metaRes.status} ${metaRes.statusText}`);
    const meta = (await metaRes.json()) as MetaJson;
    mark("meta.fetched");

    const fileUrl = meta.fileUrl;
    if (!fileUrl) throw new Error("Meta missing fileUrl");

    /* ------------- Step 3: Fetch original image ------------- */
    const imgRes = await fetch(fileUrl, { cache: "no-store" });
    if (!imgRes.ok) throw new Error(`Could not fetch original: ${imgRes.statusText}`);
    const imgArrayBuf = await imgRes.arrayBuffer();
    mark(`original.fetched (${(imgArrayBuf.byteLength / 1024).toFixed(1)}KB)`);

    const srcBlob = new Blob([imgArrayBuf], { type: "image/jpeg" });

    /* ------------- Step 4: Build prompt ------------- */
    const prompt =
      (promptOverride && promptOverride.trim()) ||
      (meta.finalizedPrompt && meta.finalizedPrompt.trim()) ||
      DEFAULT_PROMPT;
    mark("prompt.ready");

    const apiKey = process.env.OPENAI_API_KEY;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!apiKey || !blobToken) throw new Error("Missing OPENAI_API_KEY or BLOB_READ_WRITE_TOKEN");

    /* ------------- Step 5: Generate via OpenAI ------------- */
 // ...unchanged code above...

// ------------- Step 5: Generate via OpenAI -------------
const size = pickImageSize(orientation ?? undefined);
const form = new FormData();
form.append("model", "gpt-image-1");
form.append("prompt", prompt);
form.append("size", size);

// SPEED: 'standard' is noticeably faster than 'high'
const imgQuality = process.env.IMG_QUALITY === "high" ? "high" : "auto";
form.append("quality", imgQuality);

// attach the input image
form.append("image", srcBlob, "source.jpg");

// Increase the worker-side timeout to 180s (was 45s / 90s before)
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 240_000); // 3 minutes

mark("openai.begin");
const resp = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}` },
  body: form,
  signal: controller.signal,

}).catch((e) => {
  throw e.name === "AbortError"
    ? new Error("OpenAI image generation timed out (>180s)")
    : e;
});
clearTimeout(timeout);
console.log("RESPONSE FROM open AI", resp)

    mark("openai.done");
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      const lower = text.toLowerCase();
      const maybeSafety =
        lower.includes("safety") ||
        lower.includes("violence") ||
        lower.includes("policy") ||
        lower.includes("content");
      const msg = maybeSafety
        ? "Prompt rejected by safety system — try a gentler description (no gore/violence)."
        : `Image generation failed: ${text || resp.statusText}`;
      errlog("openai.error", msg);
      await updateJob(jobId, { status: "error", error: msg });
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const json = (await resp.json()) as {
      data?: { b64_json?: string | null }[];
    };
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data from OpenAI");
    mark("openai.jsonParsed");

    const cleanBuffer = Buffer.from(b64, "base64");

    // add:
    const previewBuffer = cleanBuffer;
    mark("watermark.skipped");

/* ------------- Step 6: Create watermarked preview ------------- */



// SKIP WATERMARK FOR NOW!!
// try {
//   const img = await Jimp.read(cleanBuffer);
//   const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
//   const wmText = "SPOOKIFY PREVIEW";
//   const textWidth = Jimp.measureText(font, wmText);
//   const x = (img.bitmap.width - textWidth) / 2;
//   const y = img.bitmap.height - 100;

//   const watermarked = img.clone();
//   watermarked.print(font, x, y, wmText);
//   watermarked.opacity(0.95);

//   previewBuffer = await watermarked.quality(85).getBufferAsync(Jimp.MIME_JPEG);
//   mark("watermark.done");
// } catch (e) {
//   errlog("watermark.failed -> using clean as preview", e);
//   previewBuffer = cleanBuffer; // graceful fallback
//   mark("watermark.skipped");
// }


    /* ------------- Step 7: Upload both images ------------- */
    const cleanKey = `spookify/${imageId}/result-clean.jpg`;
    const previewKey = `spookify/${imageId}/result-preview.jpg`;

    const [cleanUpload, previewUpload] = await Promise.all([
      put(cleanKey, cleanBuffer, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false,
        allowOverwrite: true,   
        token: blobToken,
      }),
      put(previewKey, previewBuffer, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false,
        allowOverwrite: true,   
        token: blobToken,
      }),
    ]);
    mark("blob.uploaded");

    /* ------------- Step 8: Update job + Firestore project ------------- */
    await updateJob(jobId, {
      status: "done",
      resultUrl: cleanUpload.url,
      previewUrl: previewUpload.url,
      error: null,
      input: { ...input },
    });

    if (userId && adminDb) {
      try {
        await adminDb
          .collection("users")
          .doc(userId)
          .collection("projects")
          .doc(jobId)
          .set(
            {
              status: "done",
              resultUrl: cleanUpload.url,
              previewUrl: previewUpload.url,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
      } catch (e) {
        console.warn(`${TAG} Firestore project update failed (non-blocking)`, e);
      }
    }

    mark("job.updated");
    log("DONE ✅", { ms: Date.now() - start, jobId });

    return NextResponse.json({
      ok: true,
      jobId,
      resultUrl: cleanUpload.url,
      previewUrl: previewUpload.url,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errlog("FATAL", msg);

    // Best-effort error reflection back into job + Firestore
    try {
      if (jobId) {
        const job = await getJob(jobId);
        const maybe = job?.input as Partial<JobInput> | undefined;

        if (maybe?.userId) {
          let adminDbFallback: import("firebase-admin/firestore").Firestore | null = null;
          try {
            adminDbFallback = (await import("@/lib/firebase/admin")).adminDb;
          } catch {
            adminDbFallback = null;
          }

          if (adminDbFallback) {
            await adminDbFallback
              .collection("users")
              .doc(maybe.userId)
              .collection("projects")
              .doc(jobId)
              .set(
                { status: "error", error: msg, updatedAt: new Date().toISOString() },
                { merge: true }
              );
          }
        }
      }
    } catch (inner) {
      console.error(`${TAG} Firestore error-status update failed`, inner);
    }

    if (jobId) await updateJob(jobId, { status: "error", error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
