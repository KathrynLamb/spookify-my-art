// src/lib/uploadBuffer.ts
import { put } from "@vercel/blob";

/**
 * Ensures filenames are sanitized for Vercel Blob.
 */
function safeFilename(path: string): string {
  const cleaned = path.replace(/[^\w./-]/g, "_");

  if (cleaned.length > 180) {
    const end = cleaned.slice(-120);
    return `file_${Date.now()}_${end}`;
  }

  return cleaned;
}

export type UploadBufferOptions = {
  contentType?: string;
  addRandomSuffix?: boolean; // optional and supported by Vercel
};

/**
 * Upload a buffer to Vercel Blob (public access).
 * Overwrites occur naturally if filename matches.
 */
export async function uploadBuffer(
  filename: string,
  buf: Buffer,
  opts: UploadBufferOptions = {}
): Promise<string> {
  const safe = safeFilename(filename);

  const blob = await put(safe, buf, {
    access: "public",
    contentType: opts.contentType ?? "image/png",
    addRandomSuffix: opts.addRandomSuffix ?? false, // default false → overwrites allowed
  });

  return blob.url;
}
