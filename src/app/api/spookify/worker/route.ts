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

async function blobToDataUrl(b: Blob, mime = "image/jpeg"): Promise<string> {
  const arr = Buffer.from(await b.arrayBuffer()).toString("base64");
  return `data:${mime};base64,${arr}`;
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
    // Parse body (id + optional input fallback)
    const bodyJson = (await req.json().catch(() => ({}))) as WorkerBody;
    jobId = bodyJson?.id?.trim() ?? "";
    if (!jobId) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

    // Try KV / memory first
    let job = await getJob(jobId);
    mark("job.lookup");

    let input: JobInput | null = null;

    if (!job) {
      const maybeInput = bodyJson.input;
      if (isSpookifyJobInput(maybeInput)) {
        input = maybeInput as JobInput;
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

    const { imageId, promptOverride, orientation, userId, title } = input!;
    const keyBase = (imageId && imageId.trim()) || jobId;

    /* ------------- Step 1: Firestore project create ------------- */
    const FIRESTORE_ENABLED = process.env.FIRESTORE_ENABLED === "1";
    let adminDb: import("firebase-admin/firestore").Firestore | null = null;

    if (FIRESTORE_ENABLED && userId) {
      try {
        const { getAdminApp } = await import("@/lib/firebaseAdminApp");
        const { getFirestore } = await import("firebase-admin/firestore");

        adminDb = getFirestore(getAdminApp());

        await adminDb
          .collection("users")
          .doc(userId)
          .collection("projects")
          .doc(jobId)
          .set(
            {
              title: title || "Untitled Spookify Project",
              status: "processing",
              imageId: imageId || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
      } catch (e) {
        console.warn(`${TAG} Firestore init/set failed (non-blocking)`, e);
      }
    }

    /* ------------- Step 2: Build prompt & optional source image ------------- */
    const hasImageId = Boolean(imageId && imageId.trim());
    let prompt = (promptOverride && promptOverride.trim()) || "";
    let srcBlob: Blob | undefined;

    if (hasImageId) {
      try {
        const mu = metaUrlFrom(imageId!);
        if (!mu) throw new Error("Missing NEXT_PUBLIC_BLOB_BASE_URL for meta lookup");

        const metaRes = await fetch(mu, { cache: "no-store" });
        if (!metaRes.ok) throw new Error(`Meta not found: ${metaRes.status} ${metaRes.statusText}`);
        const meta = (await metaRes.json()) as MetaJson;
        mark("meta.fetched");

        const fileUrl = meta.fileUrl;
        if (!fileUrl) throw new Error("Meta missing fileUrl");

        const imgRes = await fetch(fileUrl, { cache: "no-store" });
        if (!imgRes.ok) throw new Error(`Could not fetch original: ${imgRes.statusText}`);
        const imgArrayBuf = await imgRes.arrayBuffer();
        mark(`original.fetched (${(imgArrayBuf.byteLength / 1024).toFixed(1)}KB)`);

        srcBlob = new Blob([imgArrayBuf], { type: "image/jpeg" });

        prompt = prompt || (meta.finalizedPrompt?.trim() ?? "") || DEFAULT_PROMPT;
      } catch (e) {
        console.warn(`${TAG} meta/source fetch failed – falling back to text-only`, e);
        srcBlob = undefined;
        prompt = prompt || DEFAULT_PROMPT;
      }
    } else {
      prompt = prompt || DEFAULT_PROMPT;
    }

    mark("prompt.ready");

    /* ------------- Step 3: Env guards ------------- */
    const apiKey = process.env.OPENAI_API_KEY;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!apiKey || !blobToken) throw new Error("Missing OPENAI_API_KEY or BLOB_READ_WRITE_TOKEN");

    /* ------------- Step 4: Generate (OpenAI Image) ------------- */
    const size = pickImageSize(orientation ?? undefined);
    let cleanBuffer: Buffer;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 240_000);

    try {
      mark("openai.begin");
      let resp: Response;

      if (srcBlob) {
        const dataUrl = await blobToDataUrl(srcBlob, "image/jpeg");
        resp = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt,
            size,
            quality: process.env.IMG_QUALITY === "high" ? "high" : "auto",
            image: [{ image: dataUrl }],
          }),
          signal: controller.signal,
        }).catch((e) => {
          throw e.name === "AbortError"
            ? new Error("OpenAI image generation timed out (>240s)")
            : e;
        });
      } else {
        resp = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt,
            size,
            quality: process.env.IMG_QUALITY === "high" ? "high" : "auto",
          }),
          signal: controller.signal,
        }).catch((e) => {
          throw e.name === "AbortError"
            ? new Error("OpenAI image generation timed out (>240s)")
            : e;
        });
      }

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

        await updateJob(jobId, { status: "error", error: msg });
        return NextResponse.json({ error: msg }, { status: 400 });
      }

      const json = (await resp.json()) as { data?: { b64_json?: string | null }[] };
      const b64 = json?.data?.[0]?.b64_json;
      if (!b64) throw new Error("No image data from OpenAI");
      cleanBuffer = Buffer.from(b64, "base64");
    } finally {
      clearTimeout(timeout);
    }

    const previewBuffer = cleanBuffer;
    mark("watermark.skipped");

    /* ------------- Step 5: Upload images ------------- */
    const cleanKey = `spookify/${keyBase}/result-clean.jpg`;
    const previewKey = `spookify/${keyBase}/result-preview.jpg`;

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

    /* ------------- Step 6: Update job + Firestore project ------------- */
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

    // Firestore fallback update
    try {
      if (jobId) {
        const job = await getJob(jobId);
        const maybe = job?.input as Partial<JobInput> | undefined;

        if (maybe?.userId) {
          let adminDbFallback: import("firebase-admin/firestore").Firestore | null = null;

          try {
            const { getAdminApp } = await import("@/lib/firebaseAdminApp");
            const { getFirestore } = await import("firebase-admin/firestore");
            adminDbFallback = getFirestore(getAdminApp());
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
                {
                  status: "error",
                  error: msg,
                  updatedAt: new Date().toISOString(),
                },
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
