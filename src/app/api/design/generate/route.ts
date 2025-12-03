// src/app/api/design/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { uploadBuffer } from "@/lib/uploadBuffer";
import { PRODUCTS } from "@/lib/products_gallery_jolly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------------------------------------------------
 * Types
 * ------------------------------------------------------------- */
type ReferenceInput = { url: string; id?: string; role?: string };
type ClientPrintSpec = { finalWidthPx: number; finalHeightPx: number };

type GeminiInlinePart = { inlineData?: { mimeType: string; data: string } };
type GeminiCandidate = { content?: { parts?: GeminiInlinePart[] } };
type GeminiImageResponse = { candidates?: GeminiCandidate[] };

/* -------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------- */
function aspectFromNumber(n: number): string {
  const a = Number(n || 1);
  if (Math.abs(a - 1) < 0.05) return "1:1";
  if (a > 1.8) return "21:9";
  if (a > 1.6) return "16:9";
  if (a > 1.3) return "3:2";
  if (a > 1.1) return "4:3";
  return "1:1";
}

function pickPrintSpec(productId?: string, clientSpec?: ClientPrintSpec) {
  if (clientSpec) return clientSpec;

  const match = PRODUCTS.find(
    p => p.productUID === productId || p.prodigiSku === productId
  );

  return (
    match?.printSpec ?? { finalWidthPx: 2670, finalHeightPx: 1110 }
  );
}

function extractInlineImage(result: GeminiImageResponse) {
  const part = result.candidates?.[0]?.content?.parts?.find(
    p => p.inlineData?.data
  );
  return part?.inlineData
    ? { data: part.inlineData.data, mimeType: part.inlineData.mimeType }
    : null;
}

/* -------------------------------------------------------------
 * MAIN ROUTE
 * ------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  // const startTime = Date.now();

  try {
    console.log("🎨 [START] /api/design/generate");

    /* ---------------------------------------------
     * Parse input
     * --------------------------------------------- */
    const body = await req.json();
    console.log("📥 Incoming body:", body);

    const imageId: string = body.imageId;
    const prompt: string = body.prompt;
    const productId: string | undefined = body.productId;
    const generation: number = body.generation ?? 1;
    const clientPrintSpec: ClientPrintSpec | undefined = body.printSpec;
    const references: ReferenceInput[] = body.references ?? [];

    // 🔥 Required for Firestore saving
    const userId: string | undefined = body.userId;
    const productTitle: string = body.title ?? "Generated Design";

    if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    if (!imageId) return NextResponse.json({ error: "Missing imageId" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });

    const ai = new GoogleGenAI({ apiKey });

    /* ---------------------------------------------
     * Print specs
     * --------------------------------------------- */
    const { finalWidthPx, finalHeightPx } = pickPrintSpec(productId, clientPrintSpec);
    const aspectRatio = aspectFromNumber(finalWidthPx / finalHeightPx);

    /* ---------------------------------------------
     * Build inline contents
     * --------------------------------------------- */
    const contents: { text?: string; inlineData?: { mimeType: string; data: string } }[] =
      [{ text: prompt }];

    for (const ref of references) {
      if (!ref.url) continue;

      const fetched = await fetch(ref.url);
      if (!fetched.ok) continue;

      const buf = Buffer.from(await fetched.arrayBuffer());
      const mime = fetched.headers.get("content-type") ?? "image/png";

      contents.push({
        inlineData: { mimeType: mime, data: buf.toString("base64") }
      });
    }

    /* ---------------------------------------------
     * Computed paths
     * --------------------------------------------- */
    const genPath = `designs/${imageId}/gen-${generation}`;
    const latestPath = `designs/${imageId}`;

    /* ---------------------------------------------------------
     * 1) MASTER GENERATION
     * --------------------------------------------------------- */
    const masterResponse = (await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: { imageSize: "2K", aspectRatio }
      }
    })) as GeminiImageResponse;

    const masterInline = extractInlineImage(masterResponse);
    if (!masterInline)
      return NextResponse.json({ error: "No master image generated" }, { status: 500 });

    const masterBuffer = Buffer.from(masterInline.data, "base64");

    await uploadBuffer(`${genPath}/master.png`, masterBuffer, {
      contentType: masterInline.mimeType,
      addRandomSuffix: true
    });

    const rawMasterUrl = await uploadBuffer(
      `${latestPath}/master.png`,
      masterBuffer,
      {
        contentType: masterInline.mimeType,
        allowOverwrite: true
      }
    );

    const masterUrl = `${rawMasterUrl}?v=${Date.now()}`;

    /* ---------------------------------------------------------
     * 2) PREVIEW GENERATION
     * --------------------------------------------------------- */
    const previewResponse = (await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        {
          text: `Reproduce exactly and overlay watermark: "PREVIEW — NOT FOR PRINT"`
        },
        {
          inlineData: {
            mimeType: masterInline.mimeType,
            data: masterInline.data
          }
        }
      ],
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: { imageSize: "1K", aspectRatio }
      }
    })) as GeminiImageResponse;

    const previewInline = extractInlineImage(previewResponse);
    const previewBuffer = previewInline
      ? Buffer.from(previewInline.data, "base64")
      : masterBuffer;

    await uploadBuffer(`${genPath}/preview.png`, previewBuffer, {
      contentType: "image/png",
      addRandomSuffix: true
    });

    const rawPreviewUrl = await uploadBuffer(
      `${latestPath}/preview.png`,
      previewBuffer,
      {
        contentType: "image/png",
        allowOverwrite: true
      }
    );

    const previewUrl = `${rawPreviewUrl}?v=${Date.now()}`;

    /* ---------------------------------------------------------
     * 3) MOCKUP GENERATION (optional)
     * --------------------------------------------------------- */
    let mockupUrl = previewUrl;

    const product = PRODUCTS.find(
      p => p.productUID === productId || p.prodigiSku === productId
    );

    if (product?.mockup) {
      const mock = product.mockup;

      const mockResponse = (await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: [
          { text: mock.prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: previewBuffer.toString("base64")
            }
          }
        ],
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            imageSize: "2K",
            aspectRatio: "4:3",
            
          }
        }
      })) as GeminiImageResponse;

      const mockInline = extractInlineImage(mockResponse);
      const mockBuffer = mockInline
        ? Buffer.from(mockInline.data, "base64")
        : previewBuffer;

      await uploadBuffer(`${genPath}/mockup.png`, mockBuffer, {
        contentType: "image/png",
        addRandomSuffix: true
      });

      const rawMockUrl = await uploadBuffer(
        `${latestPath}/mockup.png`,
        mockBuffer,
        { contentType: "image/png", allowOverwrite: true }
      );

      mockupUrl = `${rawMockUrl}?v=${Date.now()}`;
    }

    /* ---------------------------------------------------------
     * 4) SAVE TO FIRESTORE (only if enabled)
     * --------------------------------------------------------- */
    if (process.env.FIRESTORE_ENABLED === "1" && userId) {
      try {
        const { getAdminApp } = await import("@/lib/firebaseAdminApp");
        const { getFirestore } = await import("firebase-admin/firestore");

        const db = getFirestore(getAdminApp());

        await db
          .collection("users")
          .doc(userId)
          .collection("projects")
          .doc(imageId)
          .set(
            {
              title: productTitle,
              status: "done",
              previewUrl,
              resultUrl: masterUrl,
              mockupUrl,
              productId,
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString()
            },
            { merge: true }
          );
      } catch (err) {
        console.error("🔥 Firestore save failed:", err);
      }
    }

    /* ---------------------------------------------------------
     * DONE
     * --------------------------------------------------------- */
    return NextResponse.json({
      masterUrl,
      previewUrl,
      mockupUrl,
      generation,
      revisionPath: genPath
    });
  } catch (err) {
    console.error("❌ ERROR /api/design/generate:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
