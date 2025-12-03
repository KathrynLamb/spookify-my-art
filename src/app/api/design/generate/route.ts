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
  try {
    const body: {
      imageId: string;
      prompt: string;
      productId?: string;
      generation?: number;
      printSpec?: ClientPrintSpec;
      references?: ReferenceInput[];
    } = await req.json();

    const {
      imageId,
      prompt,
      productId,
      generation = 1,
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

    const { finalWidthPx, finalHeightPx } = pickPrintSpec(
      productId,
      clientPrintSpec
    );
    const aspectRatio = aspectFromNumber(finalWidthPx / finalHeightPx);

    const contents: {
      text?: string;
      inlineData?: { mimeType: string; data: string };
    }[] = [{ text: prompt }];

    for (const ref of references) {
      if (!ref.url) continue;

      const fetched = await fetch(ref.url);
      if (!fetched.ok) continue;

      const buf = Buffer.from(await fetched.arrayBuffer());
      const mime = fetched.headers.get("content-type") ?? "image/png";

      contents.push({
        inlineData: { mimeType: mime, data: buf.toString("base64") },
      });
    }

    const genPath = `designs/${imageId}/gen-${generation}`;
    const latestPath = `designs/${imageId}`;

    /* ---------------------------------------------------------
     * MASTER
     * --------------------------------------------------------- */
    const masterResponse = (await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: { imageSize: "2K", aspectRatio },
      },
    })) as GeminiImageResponse;

    const masterInline = extractInlineImage(masterResponse);
    if (!masterInline) {
      return NextResponse.json(
        { error: "Gemini returned no master image" },
        { status: 500 }
      );
    }

    const masterBuffer = Buffer.from(masterInline.data, "base64");

    // Immutable revision (always unique)
    await uploadBuffer(`${genPath}/master.png`, masterBuffer, {
      contentType: masterInline.mimeType,
      addRandomSuffix: true,
    });

    // Latest (explicit overwrite)
    const masterUrl = await uploadBuffer(
      `${latestPath}/master.png`,
      masterBuffer,
      {
        contentType: masterInline.mimeType,
        allowOverwrite: true,
      }
    );

    /* ---------------------------------------------------------
     * PREVIEW
     * --------------------------------------------------------- */
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

    const previewInline = extractInlineImage(previewResponse);
    const previewBuffer = previewInline
      ? Buffer.from(previewInline.data, "base64")
      : masterBuffer;

    // Immutable revision
    await uploadBuffer(`${genPath}/preview.png`, previewBuffer, {
      contentType: "image/png",
      addRandomSuffix: true,
    });

    // Latest
    const previewUrl = await uploadBuffer(
      `${latestPath}/preview.png`,
      previewBuffer,
      {
        contentType: "image/png",
        allowOverwrite: true,
      }
    );

    /* ---------------------------------------------------------
     * MOCKUP
     * --------------------------------------------------------- */
    let mockupUrl = previewUrl;

    const product = PRODUCTS.find(
      (p) => p.productUID === productId || p.prodigiSku === productId
    );

    if (product?.mockup) {
      const mock = product.mockup as {
        prompt: string;
        imageSize?: string;
        aspectRatio?: string;
        [key: string]: unknown;
      };

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

      const mockInline = extractInlineImage(mockResponse);
      const mockBuffer = mockInline
        ? Buffer.from(mockInline.data, "base64")
        : previewBuffer;

      // Immutable revision
      await uploadBuffer(`${genPath}/mockup.png`, mockBuffer, {
        contentType: "image/png",
        addRandomSuffix: true,
      });

      // Latest
      mockupUrl = await uploadBuffer(`${latestPath}/mockup.png`, mockBuffer, {
        contentType: "image/png",
        allowOverwrite: true,
      });
    }

    /* ---------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------- */
    return NextResponse.json({
      masterUrl,
      previewUrl,
      mockupUrl,
      generation,
      revisionPath: genPath,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown server error";

    console.error("❌ Error in /api/design/generate:", err);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
