// /api/generate-nanobanana/route.ts
import { GoogleGenAI } from "@google/genai";
// import { saveGeneratedImage } from "@/lib/saveGeneratedImage";

/** A single reference image object passed in request */
type ReferenceInput = {
  url: string;
};

/** Our local safe representation of Gemini inline image parts */
type GeminiInlinePart = {
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

/** Fetch remote image (Firebase URL) and extract base64 + mime */
async function fetchImageAsBase64(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);

  const mimeType = res.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");

  return { mimeType, base64 };
}

/** Extract inline image part from Gemini result */
function findInlineImage(parts: unknown[]): GeminiInlinePart | undefined {
  return parts.find((p) => {
    const inline = (p as GeminiInlinePart).inlineData;
    return inline && typeof inline.data === "string";
  }) as GeminiInlinePart | undefined;
}

export async function POST(req: Request) {
  try {
    const {
      finalPrompt,
      aspect,
      references,
    }: {
      imageId: string;
      finalPrompt: string;
      aspect?: string;
      references: ReferenceInput[];
    } = await req.json();

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_KEY,
    });

    // ---- Build contents array ----
    const contents = [
      { text: finalPrompt },
      ...(await Promise.all(
        references.map(async (ref): Promise<GeminiInlinePart> => {
          const { mimeType, base64 } = await fetchImageAsBase64(ref.url);

          return {
            inlineData: {
              mimeType,
              data: base64,
            },
          };
        })
      )),
    ];

    // ---- Generate via Gemini 3 Pro Image Preview ----
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: aspect || "1:1",
          imageSize: "2K",
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    const part = parts ? findInlineImage(parts) : undefined;

    if (!part || !part.inlineData) {
      throw new Error("No image returned from Gemini.");
    }

    // const buffer = Buffer.from(part.inlineData.data, "base64");

    // ---- Save to Firebase or your bucket ----
    // const savedUrl = await saveGeneratedImage(imageId, buffer);
    console.log("Not saved thought was not a real route", response)

    return Response.json({
      ok: true,
      // resultUrl: savedUrl,
    });
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("NANOBANANA ERROR:", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
