// app/api/generate-print-package/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
  { name: 'A5', width: 1748, height: 2480, label: 'A5 (5.8×8.3")' },
  { name: 'A4', width: 2480, height: 3508, label: 'A4 (8.3×11.7")' },
  { name: 'A3', width: 3508, height: 4961, label: 'A3 (11.7×16.5")' },
];

/**
 * Smart center crop with optional face/subject detection
 */
async function cropToAspect(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number
): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }

  const srcAspect = metadata.width / metadata.height;
  const targetAspect = targetWidth / targetHeight;

  let cropWidth: number;
  let cropHeight: number;

  if (srcAspect > targetAspect) {
    // Source is wider - crop width
    cropHeight = metadata.height;
    cropWidth = Math.round(cropHeight * targetAspect);
  } else {
    // Source is taller - crop height
    cropWidth = metadata.width;
    cropHeight = Math.round(cropWidth / targetAspect);
  }

  // Center crop
  const left = Math.round((metadata.width - cropWidth) / 2);
  const top = Math.round((metadata.height - cropHeight) / 2);

  return image
    .extract({
      left: Math.max(0, left),
      top: Math.max(0, top),
      width: cropWidth,
      height: cropHeight,
    })
    .resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 95 })
    .toBuffer();
}

/**
 * Generate a cute, themed Print Guide PDF
 */
async function generatePrintGuidePDF(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const orange = rgb(0.96, 0.49, 0.2); // Spooky orange
  const purple = rgb(0.51, 0.29, 0.58); // Halloween purple
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);

  let y = height - 60;

  // Title
  page.drawText('Your Spookify Print Guide', {
    x: 50,
    y,
    size: 24,
    font: boldFont,
    color: orange,
  });
  y -= 40;

  // Intro
  page.drawText('Congratulations! Your spooky masterpiece is ready to haunt your walls.', {
    x: 50,
    y,
    size: 12,
    font,
    color: black,
  });
  y -= 20;
  page.drawText('Here\'s everything you need to print at home or at your local print shop.', {
    x: 50,
    y,
    size: 12,
    font,
    color: black,
  });
  y -= 40;

  // Section 1: What's in your package
  page.drawText('What\'s in Your Package', {
    x: 50,
    y,
    size: 16,
    font: boldFont,
    color: purple,
  });
  y -= 25;

  const packageItems = [
    '• MASTER file: Full resolution (for large prints at print shops)',
    '• 2:3, 3:4, 4:5, 5:7 ratios: Portrait & Landscape',
    '• A5, A4, A3: Perfect for standard frames',
    '• All files are 300 DPI, print-ready!',
  ];

  packageItems.forEach((item) => {
    page.drawText(item, { x: 60, y, size: 11, font, color: black });
    y -= 18;
  });
  y -= 15;

  // Section 2: Printing at Home
  page.drawText('Printing at Home (A5 - A4 sizes)', {
    x: 50,
    y,
    size: 16,
    font: boldFont,
    color: purple,
  });
  y -= 25;

  const homeSteps = [
    '1. Use the A4 or A5 file (easiest for home printers)',
    '2. Use glossy photo paper for best results (matte works too!)',
    '3. Printer settings: "Best" or "High Quality", "Borderless" if available',
    '4. Pro tip: Print a test on regular paper first to check colors',
  ];

  homeSteps.forEach((step) => {
    page.drawText(step, { x: 60, y, size: 11, font, color: black });
    y -= 18;
  });
  y -= 15;

  // Section 3: Print Shop
  page.drawText('Taking to a Print Shop (A3 and larger)', {
    x: 50,
    y,
    size: 16,
    font: boldFont,
    color: purple,
  });
  y -= 25;

  const shopSteps = [
    '1. Bring the MASTER file on a USB drive or email it to yourself',
    '2. Ask for: "High quality photo print on glossy or matte paper"',
    '3. Most shops can print up to 24×36" or larger',
    '4. Try: Staples, FedEx, local photo labs, or online (Printful, Shutterfly)',
  ];

  shopSteps.forEach((step) => {
    page.drawText(step, { x: 60, y, size: 11, font, color: black });
    y -= 18;
  });
  y -= 20;

  // Section 4: Quick Reference
  page.drawText('Quick Size Reference', {
    x: 50,
    y,
    size: 16,
    font: boldFont,
    color: purple,
  });
  y -= 25;

  const sizeGuide = [
    'Small frames (5×7", 8×10"): Use 5-7 or 4-5 files',
    'Medium frames (11×14", 12×18"): Use 3-4 or 2-3 files',
    'Large prints (16×20"+): Use MASTER file at print shop',
    'Standard frames: Use A5, A4, or A3 files',
  ];

  sizeGuide.forEach((guide) => {
    page.drawText(`• ${guide}`, { x: 60, y, size: 11, font, color: black });
    y -= 18;
  });
  y -= 20;

  // Tips section
  page.drawText('Spooky Tips', {
    x: 50,
    y,
    size: 16,
    font: boldFont,
    color: orange,
  });
  y -= 25;

  const tips = [
    '• Mix sizes for a dramatic Halloween gallery wall',
    '• Swap existing family photos for instant spooky vibes',
    '• Black frames look extra haunting',
    '• Save the MASTER file - you can reprint anytime!',
  ];

  tips.forEach((tip) => {
    page.drawText(tip, { x: 60, y, size: 11, font, color: black });
    y -= 18;
  });

  // Footer
  y = 50;
  page.drawText('Happy Haunting!', {
    x: width / 2 - 60,
    y,
    size: 14,
    font: boldFont,
    color: orange,
  });
  y -= 20;
  page.drawText('Made by Spookify', {
    x: width / 2 - 70,
    y,
    size: 10,
    font,
    color: gray,
  });

  return Buffer.from(await pdfDoc.save());
}

/**
 * Main API route handler
 */
export async function POST(req: NextRequest) {
  try {
    const { fileUrl, imageId } = await req.json();

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'Missing fileUrl' },
        { status: 400 }
      );
    }

    // Fetch the original image
    const imageResponse = await fetch(fileUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: 400 }
      );
    }

    const originalBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const zip = new JSZip();

    // 1. Add MASTER files (full resolution)
    const masterPng = await sharp(originalBuffer).png({ quality: 100 }).toBuffer();
    const masterJpg = await sharp(originalBuffer).jpeg({ quality: 100 }).toBuffer();
    
    zip.file('spookified-MASTER-full-resolution.png', masterPng);
    zip.file('spookified-MASTER-full-resolution.jpg', masterJpg);

    // 2. Generate all aspect ratio crops (portrait and landscape)
    for (const ratio of ASPECT_RATIOS) {
      // Portrait
      const portraitBuffer = await cropToAspect(
        originalBuffer,
        ratio.width,
        ratio.height
      );
      zip.file(`spookified-${ratio.name}-portrait.jpg`, portraitBuffer);

      // Landscape (swap dimensions)
      const landscapeBuffer = await cropToAspect(
        originalBuffer,
        ratio.height,
        ratio.width
      );
      zip.file(`spookified-${ratio.name}-landscape.jpg`, landscapeBuffer);
    }

    // 3. Add Print Guide PDF
    const printGuidePdf = await generatePrintGuidePDF();
    zip.file('PRINT-GUIDE.pdf', printGuidePdf);

    // 4. Generate zip
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

// 5. Return zip file (safe for both Node and Edge)
const arrayBuffer = zipBuffer.buffer.slice(
    zipBuffer.byteOffset,
    zipBuffer.byteOffset + zipBuffer.byteLength
  );
  
  return new NextResponse(arrayBuffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="spookify-print-package-${imageId || 'download'}.zip"`,
    },
  });
  } catch (error) {
    console.error('Error generating print package:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate package' },
      { status: 500 }
    );
  }
}