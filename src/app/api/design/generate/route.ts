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
    (p) => p.productUID === productId || p.prodigiSku === productId
  );

  return (
    match?.printSpec ?? {
      finalWidthPx: 2670,
      finalHeightPx: 1110,
    }
  );
}

function extractInlineImage(result: GeminiImageResponse) {
  const part = result.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.data
  );
  return part?.inlineData
    ? { data: part.inlineData.data, mimeType: part.inlineData.mimeType }
    : null;
}

/* -------------------------------------------------------------
 * MAIN ROUTE
 * ------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    console.log("🎨 [START] /api/design/generate");

    /* ---------------------------------------------
     * Parse input
     * --------------------------------------------- */
    const body = await req.json();
    console.log("📥 Incoming body:", JSON.stringify(body, null, 2));

    const imageId: string = body.imageId;
    const prompt: string = body.prompt;
    const productId: string | undefined = body.productId;
    const generation: number = body.generation ?? 1;
    const clientPrintSpec: ClientPrintSpec | undefined = body.printSpec;
    const references: ReferenceInput[] = body.references ?? [];

    if (!prompt) {
      console.log("❌ Missing prompt");
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    if (!imageId) {
      console.log("❌ Missing imageId");
      return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("❌ Missing GEMINI_API_KEY");
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    console.log("⚙️ Using Gemini key:", apiKey.slice(0, 5) + "...");

    /* ---------------------------------------------
     * Print specs
     * --------------------------------------------- */
    const { finalWidthPx, finalHeightPx } = pickPrintSpec(
      productId,
      clientPrintSpec
    );

    const aspectRatio = aspectFromNumber(finalWidthPx / finalHeightPx);

    console.log(
      `📐 Print spec: ${finalWidthPx}x${finalHeightPx} (AR: ${aspectRatio})`
    );

    /* ---------------------------------------------
     * Build inline contents
     * --------------------------------------------- */
    const contents: {
      text?: string;
      inlineData?: { mimeType: string; data: string };
    }[] = [{ text: prompt }];

    console.log(`🖼  Adding ${references.length} reference images…`);

    for (const ref of references) {
      if (!ref.url) continue;

      console.log("↳ Fetching ref:", ref.url);

      const fetched = await fetch(ref.url);
      if (!fetched.ok) {
        console.log("❌ Error fetching reference:", ref.url);
        continue;
      }

      const buf = Buffer.from(await fetched.arrayBuffer());
      const mime = fetched.headers.get("content-type") ?? "image/png";

      contents.push({
        inlineData: { mimeType: mime, data: buf.toString("base64") },
      });

      console.log(
        `✓ Loaded reference (${mime}, ${Math.round(
          buf.length / 1024
        )} KB) from ${ref.url}`
      );
    }

    /* ---------------------------------------------
     * Computed paths
     * --------------------------------------------- */
    const genPath = `designs/${imageId}/gen-${generation}`;
    const latestPath = `designs/${imageId}`;

    console.log("📁 genPath =", genPath);
    console.log("📁 latestPath =", latestPath);

    /* ---------------------------------------------------------
     * 1) MASTER
     * --------------------------------------------------------- */
    console.log("🎨 Generating MASTER…");
    const tMaster = Date.now();

    const masterResponse = (await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: { imageSize: "2K", aspectRatio },
      },
    })) as GeminiImageResponse;

    console.log("⏱ MASTER generation took", Date.now() - tMaster, "ms");

    const masterInline = extractInlineImage(masterResponse);

    if (!masterInline) {
      console.log("❌ Gemini returned no master image");
      return NextResponse.json(
        { error: "Gemini returned no master image" },
        { status: 500 }
      );
    }

    const masterBuffer = Buffer.from(masterInline.data, "base64");
    console.log(
      `✓ MASTER inline image extracted (${Math.round(
        masterBuffer.length / 1024
      )} KB)`
    );

    /* Save immutable revision */
    console.log("📤 Uploading MASTER revision…");
    await uploadBuffer(`${genPath}/master.png`, masterBuffer, {
      contentType: masterInline.mimeType,
      addRandomSuffix: true,
    });

    /* Save latest (overwrite) */
    console.log("📤 Uploading MASTER latest…");
    const rawMasterUrl = await uploadBuffer(
      `${latestPath}/master.png`,
      masterBuffer,
      {
        contentType: masterInline.mimeType,
        allowOverwrite: true,
      }
    );

    // CACHE BUSTING
    const masterUrl = `${rawMasterUrl}?v=${Date.now()}`;
    console.log("🔗 masterUrl =", masterUrl);

    /* ---------------------------------------------------------
     * 2) PREVIEW
     * --------------------------------------------------------- */
    console.log("🎨 Generating PREVIEW…");
    const tPreview = Date.now();

    const previewPrompt = `
Reproduce the supplied artwork exactly and overlay a diagonal semi-transparent watermark:
"PREVIEW — NOT FOR PRINT"
No cropping or modifications.
`;

    const previewResponse = (await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        { text: previewPrompt },
        {
          inlineData: {
            mimeType: masterInline.mimeType,
            data: masterInline.data,
          },
        },
      ],
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: { imageSize: "1K", aspectRatio },
      },
    })) as GeminiImageResponse;

    console.log("⏱ PREVIEW generation took", Date.now() - tPreview, "ms");

    const previewInline = extractInlineImage(previewResponse);
    const previewBuffer = previewInline
      ? Buffer.from(previewInline.data, "base64")
      : masterBuffer;

    console.log(
      `✓ PREVIEW buffer ready (${Math.round(
        previewBuffer.length / 1024
      )} KB)`
    );

    /* Upload preview revision */
    console.log("📤 Uploading PREVIEW revision…");
    await uploadBuffer(`${genPath}/preview.png`, previewBuffer, {
      contentType: "image/png",
      addRandomSuffix: true,
    });

    /* Upload preview latest */
    console.log("📤 Uploading PREVIEW latest…");
    const rawPreviewUrl = await uploadBuffer(
      `${latestPath}/preview.png`,
      previewBuffer,
      {
        contentType: "image/png",
        allowOverwrite: true,
      }
    );

    const previewUrl = `${rawPreviewUrl}?v=${Date.now()}`;
    console.log("🔗 previewUrl =", previewUrl);

    /* ---------------------------------------------------------
     * 3) MOCKUP
     * --------------------------------------------------------- */
    let mockupUrl = previewUrl;

    const product = PRODUCTS.find(
      (p) => p.productUID === productId || p.prodigiSku === productId
    );

    if (product?.mockup) {
      console.log("🎨 Generating MOCKUP…");

      const mock = product.mockup as {
        prompt: string;
        imageSize?: string;
        aspectRatio?: string;
      };

      const tMock = Date.now();

      const mockResponse = (await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: [
          { text: mock.prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: previewBuffer.toString("base64"),
            },
          },
        ],
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            imageSize: mock.imageSize ?? "2K",
            aspectRatio: mock.aspectRatio ?? "4:3",
          },
        },
      })) as GeminiImageResponse;

      console.log("⏱ MOCKUP generation took", Date.now() - tMock, "ms");

      const mockInline = extractInlineImage(mockResponse);
      const mockBuffer = mockInline
        ? Buffer.from(mockInline.data, "base64")
        : previewBuffer;

      console.log(
        `✓ MOCKUP buffer ready (${Math.round(
          mockBuffer.length / 1024
        )} KB)`
      );

      /* Upload mockup revision */
      console.log("📤 Uploading MOCKUP revision…");
      await uploadBuffer(`${genPath}/mockup.png`, mockBuffer, {
        contentType: "image/png",
        addRandomSuffix: true,
      });

      /* Upload latest */
      console.log("📤 Uploading MOCKUP latest…");
      const rawMockupUrl = await uploadBuffer(
        `${latestPath}/mockup.png`,
        mockBuffer,
        {
          contentType: "image/png",
          allowOverwrite: true,
        }
      );

      mockupUrl = `${rawMockupUrl}?v=${Date.now()}`;
      console.log("🔗 mockupUrl =", mockupUrl);
    } else {
      console.log("ℹ️ No mockup config for product:", productId);
    }

    /* ---------------------------------------------------------
     * DONE
     * --------------------------------------------------------- */
    console.log("✅ [DONE] Total time:", Date.now() - startTime, "ms");

    return NextResponse.json({
      masterUrl,
      previewUrl,
      mockupUrl,
      generation,
      revisionPath: genPath,
    });
  } catch (err) {
    console.error("❌ ERROR in /api/design/generate:", err);
    const message =
      err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
