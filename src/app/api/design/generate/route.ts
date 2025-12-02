import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { uploadBuffer } from "@/lib/uploadBuffer";
import { PRODUCTS } from "@/lib/products_gallery_jolly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------------------------------------------------
 * Types
 * ------------------------------------------------------------- */

type ReferenceInput = {
  url: string;
  id?: string;
  role?: string;
};

type ClientPrintSpec = {
  finalWidthPx: number;
  finalHeightPx: number;
};

type ProductPrintSpec = {
  finalWidthPx: number;
  finalHeightPx: number;
};

type GeminiInlinePart = {
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiInlinePart[];
  };
};

// Gemini 3 returns a predictable structure but SDK does not export a type.
// We define a minimal runtime-safe version:
type GeminiImageResponse = {
  candidates?: GeminiCandidate[];
  // allow any other fields returned by SDK
  [key: string]: unknown;
};


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

function pickPrintSpec(
  productId?: string,
  clientSpec?: ClientPrintSpec
): ProductPrintSpec {
  if (clientSpec?.finalWidthPx && clientSpec?.finalHeightPx) {
    return {
      finalWidthPx: clientSpec.finalWidthPx,
      finalHeightPx: clientSpec.finalHeightPx,
    };
  }

  const match = PRODUCTS.find(
    (p) => p.productUID === productId || p.prodigiSku === productId
  );

  if (match?.printSpec) {
    return {
      finalWidthPx: match.printSpec.finalWidthPx,
      finalHeightPx: match.printSpec.finalHeightPx,
    };
  }

  return { finalWidthPx: 2670, finalHeightPx: 1110 };
}

/* -------------------------------------------------------------
 * Extract first inline base64 image from Gemini
 * ------------------------------------------------------------- */
function extractInlineImage(
  result: GeminiImageResponse
): { data: string; mimeType: string } | null {
  const part = result.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.data
  );

  if (!part?.inlineData) return null;

  return {
    data: part.inlineData.data,
    mimeType: part.inlineData.mimeType,
  };
}

/* -------------------------------------------------------------
 * MAIN ROUTE
 * ------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      imageId?: string;
      prompt?: string;
      productId?: string;
      printSpec?: ClientPrintSpec;
      references?: ReferenceInput[];
    };

    const {
      imageId,
      prompt,
      productId,
      printSpec: clientPrintSpec,
      references = [],
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    /* -------------------- PRINT SIZE -------------------- */
    const { finalWidthPx, finalHeightPx } = pickPrintSpec(
      productId,
      clientPrintSpec
    );

    const aspectRatio = aspectFromNumber(finalWidthPx / finalHeightPx);

    /* -------------------- BUILD CONTENTS -------------------- */
    const contents: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: prompt },
    ];

    for (const ref of references) {
      if (!ref.url) continue;

      const fetched = await fetch(ref.url);
      if (!fetched.ok) continue;

      const buf = Buffer.from(await fetched.arrayBuffer());
      const mime = fetched.headers.get("content-type") ?? "image/png";

      contents.push({
        inlineData: {
          mimeType: mime,
          data: buf.toString("base64"),
        },
      });
    }

    /* -------------------------------------------------------------
     * 1) MASTER (print-ready artwork)
     * ------------------------------------------------------------- */
    const masterGen = (await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          imageSize: "2K",
          aspectRatio,
        },
      },
    })) as unknown as GeminiImageResponse;

    const masterImg = extractInlineImage(masterGen);

    if (!masterImg) {
      return NextResponse.json(
        { error: "Gemini returned no master image" },
        { status: 500 }
      );
    }

    const masterBuffer = Buffer.from(masterImg.data, "base64");
    const safeId = imageId || `design-${Date.now()}`;

    const masterUrl = await uploadBuffer(
      `designs/${safeId}/master.png`,
      masterBuffer,
      { contentType: masterImg.mimeType }
    );

    /* -------------------------------------------------------------
     * 2) PREVIEW (watermarked)
     * ------------------------------------------------------------- */

    const previewPrompt = `
Reproduce the exact supplied artwork and overlay a diagonal semi-transparent watermark:
"PREVIEW — NOT FOR PRINT"
Nothing else should be changed.  
Same aspect ratio.  
No cropping or borders.
    `;

    const previewGen = (await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        { text: previewPrompt },
        {
          inlineData: {
            mimeType: masterImg.mimeType,
            data: masterImg.data,
          },
        },
      ],
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          imageSize: "1K",
          aspectRatio,
        },
      },
    })) as unknown as GeminiImageResponse;

    const previewImg = extractInlineImage(previewGen);
    const previewBuffer = previewImg
      ? Buffer.from(previewImg.data, "base64")
      : masterBuffer;

    const previewUrl = await uploadBuffer(
      `designs/${safeId}/preview.png`,
      previewBuffer,
      { contentType: "image/png" }
    );

    /* -------------------------------------------------------------
     * 3) MOCKUP
     * ------------------------------------------------------------- */

    const product = PRODUCTS.find(
      (p) => p.productUID === productId || p.prodigiSku === productId
    );

    const mock = product?.mockup;

    if (!mock) {
      console.warn("[design/generate] No mockup config for product:", productId);
      return NextResponse.json({
        masterUrl,
        previewUrl,
        mockupUrl: previewUrl,
      });
    }

    const mockupGen = (await ai.models.generateContent({
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
    
        // ---- FIX: Remove `any`, replace with typed wrapper ----
        imageConfig: {
          // Allow mock to optionally include overrides:
          ...(() => {
            type MockupConfigLoose = {
              imageSize?: string;
              aspectRatio?: string;
              prompt: string;
              [key: string]: unknown;
            };
    
            const m = mock as unknown as MockupConfigLoose;
    
            return {
              imageSize: m.imageSize ?? "2K",
              aspectRatio: m.aspectRatio ?? "4:3",
            };
          })(),
        },
      },
    })) as unknown as GeminiImageResponse;
    

    const mockImg = extractInlineImage(mockupGen);
    const mockupBuffer = mockImg
      ? Buffer.from(mockImg.data, "base64")
      : previewBuffer;

    const mockupUrl = await uploadBuffer(
      `designs/${safeId}/mockup.png`,
      mockupBuffer,
      { contentType: "image/png" }
    );

    /* -------------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------------- */
    return NextResponse.json({
      masterUrl,
      previewUrl,
      mockupUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ /api/design/generate error", err);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
