// lib/makePrintAsset.ts
import sharp from 'sharp';

export type MakeAssetArgs = {
  srcUrl: string;             // the generated design image URL
  target: { w: number; h: number };
  background?: string | null; // null → preserve transparency for PNG
  mode?: 'cover'|'contain';   // usually 'cover' for full-bleed faces
  format: 'png'|'jpg';
  quality?: number;           // jpg quality if needed
};

// fetch into a buffer (node)
async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function makePrintAsset({
  srcUrl, target, background = null, mode = 'cover', format, quality = 92,
}: MakeAssetArgs): Promise<Buffer> {
  const buf = await fetchBuffer(srcUrl);
  const img = sharp(buf, { limitInputPixels: false }).ensureAlpha();

  const resized =
    mode === 'cover'
      ? img.resize(target.w, target.h, { fit: 'cover', position: 'centre' })
      : img.resize(target.w, target.h, { fit: 'contain', background: background ?? { r:0,g:0,b:0,alpha:0 } });

  const flattened = background == null
    ? resized // keep alpha
    : resized.flatten({ background });

  return format === 'png'
    ? flattened.png({ compressionLevel: 9 }).toBuffer()
    : flattened.jpeg({ quality, mozjpeg: true }).toBuffer();
}
