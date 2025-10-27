// app/api/generate-print-package/route.ts
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ---------------- Image adapter: Sharp with Jimp fallback ---------------- */

type ImageAdapter = {
  name: 'sharp' | 'jimp';
  toPNG(buf: Buffer, quality?: number): Promise<Buffer>;
  toJPG(buf: Buffer, quality?: number): Promise<Buffer>;
  cropToAspect(buf: Buffer, targetW: number, targetH: number): Promise<Buffer>;
};

async function loadAdapter(): Promise<ImageAdapter> {
  // Try Sharp first (fast/best)
  try {
    const mod = await import('sharp');
    const sharp = mod.default;

    const toPNG = (buf: Buffer, quality = 100) =>
      sharp(buf).png({ quality }).toBuffer();
    const toJPG = (buf: Buffer, quality = 100) =>
      sharp(buf).jpeg({ quality }).toBuffer();

    const cropToAspect = async (buf: Buffer, targetW: number, targetH: number) => {
      const img = sharp(buf);
      const meta = await img.metadata();
      if (!meta.width || !meta.height) throw new Error('Unable to read image dimensions');

      const srcW = meta.width;
      const srcH = meta.height;
      const srcAspect = srcW / srcH;
      const tgtAspect = targetW / targetH;

      let cropW: number;
      let cropH: number;
      if (srcAspect > tgtAspect) {
        cropH = srcH;
        cropW = Math.round(cropH * tgtAspect);
      } else {
        cropW = srcW;
        cropH = Math.round(cropW / tgtAspect);
      }

      const left = Math.max(0, Math.round((srcW - cropW) / 2));
      const top = Math.max(0, Math.round((srcH - cropH) / 2));

      return img
        .extract({ left, top, width: cropW, height: cropH })
        .resize(targetW, targetH, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 95 })
        .toBuffer();
    };

    return { name: 'sharp', toPNG, toJPG, cropToAspect };
  } catch (err) {
    console.warn('[print-package] sharp unavailable → falling back to jimp:', (err as Error)?.message || err);
  }

  // Fallback: Jimp (pure JS)
  const Jimp = (await import('jimp')).default;

  const toPNG = async (buf: Buffer) => {
    const img = await Jimp.read(buf);
    return img.getBufferAsync(Jimp.MIME_PNG);
  };
  const toJPG = async (buf: Buffer, quality = 100) => {
    const img = await Jimp.read(buf);
    img.quality(Math.max(1, Math.min(100, quality)));
    return img.getBufferAsync(Jimp.MIME_JPEG);
  };

  const cropToAspect = async (buf: Buffer, targetW: number, targetH: number) => {
    const img = await Jimp.read(buf);
    const srcW = img.bitmap.width;
    const srcH = img.bitmap.height;

    const srcAspect = srcW / srcH;
    const tgtAspect = targetW / targetH;

    let cropW = srcW;
    let cropH = srcH;
    if (srcAspect > tgtAspect) {
      cropH = srcH;
      cropW = Math.round(cropH * tgtAspect);
    } else {
      cropW = srcW;
      cropH = Math.round(cropW / tgtAspect);
    }

    const left = Math.max(0, Math.round((srcW - cropW) / 2));
    const top = Math.max(0, Math.round((srcH - cropH) / 2));

    img.crop(left, top, cropW, cropH).resize(targetW, targetH);
    return img.getBufferAsync(Jimp.MIME_JPEG);
  };

  return { name: 'jimp', toPNG, toJPG, cropToAspect };
}

/* ---------------- Ratios & helpers ---------------- */

type AspectRatio = {
  name: string;
  width: number;
  height: number;
  label: string;
};

const ASPECT_RATIOS: AspectRatio[] = [
  { name: '2-3', width: 3000, height: 4500, label: '2:3 (10×15" to 20×30")' },
  { name: '3-4', width: 3000, height: 4000, label: '3:4 (9×12" to 18×24")' },
  { name: '4-5', width: 3200, height: 4000, label: '4:5 (8×10" to 16×20")' },
  { name: '5-7', width: 2500, height: 3500, label: '5:7 (5×7" to 10×14")' },
  { name: 'A5',  width: 1748, height: 2480, label: 'A5 (5.8×8.3")' },
  { name: 'A4',  width: 2480, height: 3508, label: 'A4 (8.3×11.7")' },
  { name: 'A3',  width: 3508, height: 4961, label: 'A3 (11.7×16.5")' },
];

/* ---------------- PDF guide ---------------- */

async function generatePrintGuidePDF(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const orange = rgb(0.96, 0.49, 0.2);
  const purple = rgb(0.51, 0.29, 0.58);
  const black  = rgb(0, 0, 0);
  const gray   = rgb(0.4, 0.4, 0.4);

  let y = height - 60;

  const h = (t: string, c = purple) => { page.drawText(t, { x: 50, y, size: 16, font: bold, color: c }); y -= 25; };
  const p = (t: string) => { page.drawText(t, { x: 50, y, size: 12, font, color: black }); y -= 20; };
  const li = (t: string) => { page.drawText(t, { x: 60, y, size: 11, font, color: black }); y -= 18; };

  page.drawText('Your Spookify Print Guide', { x: 50, y, size: 24, font: bold, color: orange }); y -= 40;
  p('Congratulations! Your spooky masterpiece is ready to haunt your walls.');
  p('Here’s everything you need to print at home or at your local print shop.'); y -= 10;

  h("What's in Your Package");
  [
    '• MASTER file: Full resolution (for large prints at print shops)',
    '• 2:3, 3:4, 4:5, 5:7 ratios: Portrait & Landscape',
    '• A5, A4, A3: Perfect for standard frames',
    '• All files are 300 DPI, print-ready!',
  ].forEach(li); y -= 5;

  h('Printing at Home (A5 - A4 sizes)');
  [
    '1. Use the A4 or A5 file',
    '2. Glossy photo paper for best results (matte works too)',
    '3. Printer settings: “Best/High Quality”, “Borderless” if available',
    '4. Print a test on regular paper first',
  ].forEach(li); y -= 5;

  h('Taking to a Print Shop (A3 and larger)');
  [
    '1. Bring the MASTER file on a USB or email it',
    '2. Ask for: “High quality photo print on glossy or matte paper”',
    '3. Most shops can print up to 24×36" or larger',
    '4. Try: Staples, FedEx, local photo labs, or online',
  ].forEach(li); y -= 5;

  h('Quick Size Reference');
  [
    '• Small frames (5×7", 8×10"): Use 5-7 or 4-5 files',
    '• Medium frames (11×14", 12×18"): Use 3-4 or 2-3 files',
    '• Large prints (16×20"+): Use MASTER file at print shop',
    '• Standard frames: Use A5, A4, or A3 files',
  ].forEach(li);

  y = 50;
  page.drawText('Happy Haunting!', { x: width / 2 - 60, y, size: 14, font: bold, color: orange });
  y -= 20;
  page.drawText('Made by Spookify', { x: width / 2 - 70, y, size: 10, font, color: gray });

  return Buffer.from(await pdfDoc.save());
}

/* ---------------- Route handler ---------------- */

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, imageId } = await req.json();
    if (!fileUrl) return NextResponse.json({ error: 'Missing fileUrl' }, { status: 400 });

    const src = await fetch(fileUrl, { cache: 'no-store' });
    if (!src.ok) return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 });
    const original = Buffer.from(await src.arrayBuffer());

    const adapter = await loadAdapter();
    const zip = new JSZip();

    // 1) MASTER files
    const masterPng = await adapter.toPNG(original, 100);
    const masterJpg = await adapter.toJPG(original, 100);
    zip.file('spookified-MASTER-full-resolution.png', masterPng);
    zip.file('spookified-MASTER-full-resolution.jpg', masterJpg);

    // 2) Aspect ratio crops (portrait + landscape)
    for (const ratio of ASPECT_RATIOS) {
      const portrait = await adapter.cropToAspect(original, ratio.width, ratio.height);
      zip.file(`spookified-${ratio.name}-portrait.jpg`, portrait);

      const landscape = await adapter.cropToAspect(original, ratio.height, ratio.width);
      zip.file(`spookified-${ratio.name}-landscape.jpg`, landscape);
    }

    // 3) Print Guide PDF
    const guide = await generatePrintGuidePDF();
    zip.file('PRINT-GUIDE.pdf', guide);

    // 4) ZIP → Response
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
    const arrayBuffer = zipBuf.buffer.slice(zipBuf.byteOffset, zipBuf.byteOffset + zipBuf.byteLength);

    return new NextResponse(arrayBuffer as unknown as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="spookify-print-package-${imageId || 'download'}.zip"`,
      },
    });
  } catch (err) {
    console.error('Error generating print package:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate package' },
      { status: 500 }
    );
  }
}
