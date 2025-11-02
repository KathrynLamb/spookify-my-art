// app/api/spookify/worker/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getJob, updateJob, type SpookifyJobInput } from "@/lib/jobs";

/* ---------------- Types ---------------- */
type JobInput = SpookifyJobInput & {
  userId?: string | null;
  title?: string | null;
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

/* ---------------- Route ---------------- */
export async function POST(req: Request) {
  const start = Date.now();
  const mark = (label: string) => log(`${label.padEnd(20)} +${Date.now() - start}ms`);

  mark("worker.start");
  let jobId = "";

  try {
    // Heavy deps – load only when invoked
    const { Jimp } = await import("jimp");

    const body = await req.json().catch(() => ({}));
    jobId = body?.id ?? "";
    if (!jobId) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

    const job = await getJob(jobId);
    mark("job.lookup");
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    await updateJob(jobId, { status: "processing" });

    const rawInput = job.input as unknown;
    if (!isSpookifyJobInput(rawInput)) {
      await updateJob(jobId, { status: "error", error: "Invalid job input" });
      return NextResponse.json({ error: "Invalid job input" }, { status: 400 });
    }
    const input = rawInput as JobInput;
    const { imageId, promptOverride, orientation, userId, title } = input;

    /* ------------- Step 1: (Lazy) Firestore project create ------------- */
    // Avoid initializing Admin SDK at build time: import only when needed.
    let adminDb: import("firebase-admin/firestore").Firestore | null = null;
    if (userId) {
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
    const meta = await metaRes.json();
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
    const size = pickImageSize(orientation ?? undefined);
    const form = new FormData();
    form.append("model", "gpt-image-1");
    form.append("prompt", prompt);
    form.append("size", size);
    // form.append("quality", "standard");
    form.append("quality", "high");
    form.append("image", srcBlob, "source.jpg");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    mark("openai.begin");
    const resp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: controller.signal,
    }).catch((e) => {
      throw e.name === "AbortError"
        ? new Error("OpenAI image generation timed out (>45s)")
        : e;
    });
    clearTimeout(timeout);

    mark("openai.done");
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      const lower = text.toLowerCase();
      const maybeSafety =
        lower.includes("safety") || lower.includes("violence") || lower.includes("policy") || lower.includes("content");
      const msg = maybeSafety
        ? "Prompt rejected by safety system — try a gentler description (no gore/violence)."
        : `Image generation failed: ${text || resp.statusText}`;
      errlog("openai.error", msg);
      await updateJob(jobId, { status: "error", error: msg });
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const json = await resp.json();
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data from OpenAI");
    mark("openai.jsonParsed");

    const cleanBuffer = Buffer.from(b64, "base64");

    /* ------------- Step 6: Create watermarked preview ------------- */
    const img = await Jimp.read(cleanBuffer);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    const text = "SPOOKIFY PREVIEW";
    const textWidth = Jimp.measureText(font, text);
    const x = (img.bitmap.width - textWidth) / 2;
    const y = img.bitmap.height - 100;

    const watermarked = img.clone();
    watermarked.print(font, x, y, text);
    watermarked.opacity(0.95);

    const previewBuffer = await watermarked.quality(85).getBufferAsync(Jimp.MIME_JPEG);
    mark("watermark.done");

    /* ------------- Step 7: Upload both images ------------- */
    const cleanKey = `spookify/${imageId}/result-clean.jpg`;
    const previewKey = `spookify/${imageId}/result-preview.jpg`;

    const [cleanUpload, previewUpload] = await Promise.all([
      put(cleanKey, cleanBuffer, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false,
        token: blobToken,
      }),
      put(previewKey, previewBuffer, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false,
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

    // Best-effort Firestore error reflection
// Best-effort Firestore error reflection (typed, no `any`)
try {
  if (jobId) {
    const job = await getJob(jobId);
    const maybe = job?.input as Partial<JobInput> | undefined;

    if (maybe?.userId) {
      // Optional, typed dynamic import of admin Firestore
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
