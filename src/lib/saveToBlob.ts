// lib/saveToBlob.ts
import { put } from '@vercel/blob';

export async function savePrintBufferToBlob(opts: {
  buf: Buffer;
  path: string;            // e.g. "prints/ORDERID/front.png"
  contentType: string;     // "image/png" | "image/jpeg"
}) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN');

  const { url } = await put(opts.path, opts.buf, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: opts.contentType,
    token,
  });

  return url; // public URL
}
