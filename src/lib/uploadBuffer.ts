// src/lib/uploadBuffer.ts
import { put } from "@vercel/blob";

/**
 * Ensures the filename is safe for Vercel Blob.
 * Max total path allowed is 950 chars, but we keep it < 200.
 */
function safeFilename(path: string): string {
  // Remove slashes, spaces, etc
  const cleaned = path.replace(/[^\w.-]/g, "_");

  // Cap length
  if (cleaned.length > 120) {
    // keep the last 100 chars (most likely the .png extension)
    const end = cleaned.slice(-100);
    return `file_${Date.now()}_${end}`;
  }

  return cleaned;
}

/**
 * Upload buffer to Vercel Blob.
 * @param filename  suggested filename (we sanitize it)
 * @param buf       binary data
 * @param opts      { contentType: string }
 */
export async function uploadBuffer(
  filename: string,
  buf: Buffer,
  opts: { contentType?: string } = {}
): Promise<string> {
  const safe = safeFilename(filename);

  const blob = await put(safe, buf, {
    access: "public",
    contentType: opts.contentType ?? "image/png",
  });

  return blob.url;
}
