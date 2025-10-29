// app/api/generate-print-package/route.ts
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Jimp } from "jimp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Use one Buffer alias everywhere to avoid generic mismatches
type NodeBuf = Buffer<ArrayBufferLike>;

/* -------- PDF guide -------- */
async function generatePrintGuidePDF(): Promise<NodeBuf> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const orange = rgb(0.96, 0.49, 0.2);
  const gray = rgb(0.4, 0.4, 0.4);

  let y = height - 60;
  page.drawText("Your Spookify Print Guide", { x: 50, y, size: 24, font: bold, color: orange });
  y -= 40;
  page.drawText("Thanks for bringing your art to life!", { x: 50, y, size: 12, font });
  y -= 20;
  page.drawText("• Use A4 version for home prints", { x: 60, y, size: 12, font });
  y -= 20;
  page.drawText("• Use master file for large prints", { x: 60, y, size: 12, font });
  y -= 40;
  page.drawText("Happy Haunting!", { x: width / 2 - 60, y, size: 14, font: bold, color: orange });
  y -= 20;
  page.drawText("Made by Spookify", { x: width / 2 - 70, y, size: 10, font, color: gray });

  // pdf-lib gives Uint8Array; convert to NodeBuf
  const out = await pdfDoc.save();
  return Buffer.from(out.buffer) as unknown as NodeBuf;
}

/* -------- Watermark helper -------- */
// keep your NodeBuf alias if you added it: type NodeBuf = Buffer<ArrayBufferLike>;

async function addWatermark(base: NodeBuf): Promise<NodeBuf> {
  const img = await Jimp.read(base);

  const text = "SPOOKIFY PREVIEW";
  const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  const textWidth = Jimp.measureText(font, text);

  const x = Math.max(10, Math.round((img.bitmap.width - textWidth) / 2));
  const y = Math.max(10, img.bitmap.height - 100);

  const stamped = img.clone();
  // Jimp typings mark .print() as void in some versions — do NOT chain
  stamped.print(font, x, y, text);
  stamped.opacity(0.95);

  const out = await stamped.quality(90).getBufferAsync(Jimp.MIME_JPEG);
  return out as unknown as NodeBuf;
}


/* -------- Route -------- */
export async function POST(req: Request) {
  try {
    const { fileUrl, imageId, watermarked } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });
    }

    const res = await fetch(fileUrl, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "Could not fetch image" }, { status: 404 });
    }

    // Normalize to our NodeBuf alias
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf) as unknown as NodeBuf;

    const zip = new JSZip();

    let master: NodeBuf = buf;

    // Optional watermark for unpaid users
    if (Boolean(watermarked)) {
      master = await addWatermark(buf);
      zip.file(
        "README.txt",
        "This is a preview file only. Purchase required for full-quality print."
      );
    }

    // MASTER (use Uint8Array for JSZip to avoid Buffer generic noise)
    zip.file("spookify-master.jpg", new Uint8Array(master));

    // A4 resized (approx 2480x3508 @ 300dpi)
    const a4Img = await Jimp.read(master);
    a4Img.resize(2480, 3508).quality(90);
    const a4Buffer = (await a4Img.getBufferAsync(Jimp.MIME_JPEG)) as unknown as NodeBuf;
    zip.file("spookify-A4.jpg", new Uint8Array(a4Buffer));

    // PDF guide
    const guide = await generatePrintGuidePDF();
    zip.file("PRINT-GUIDE.pdf", new Uint8Array(guide));

// ZIP → Response (Blob-based, type-safe)
// ZIP → Response (fresh ArrayBuffer to satisfy TS/Web API)
const zipBytes = await zip.generateAsync({ type: "uint8array" }); // Uint8Array

// Make a brand-new ArrayBuffer (not SharedArrayBuffer)
const ab = new ArrayBuffer(zipBytes.byteLength);
new Uint8Array(ab).set(zipBytes);

return new NextResponse(ab, {
  headers: {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="spookify-${imageId || "artwork"}.zip"`,
    "Cache-Control": "no-store",
  },
});



  } catch (err) {
    console.error("❌ generate-print-package error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate print package" },
      { status: 500 }
    );
  }
}
