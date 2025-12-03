// src/lib/uploadBuffer.ts
import { put } from "@vercel/blob";

/**
 * Vercel Blob-safe filename sanitizer that preserves folder structure.
 */
function safeFilename(path: string): string {
  // Preserve: letters, numbers, /, _, -, .
  // Replace anything else with underscores.
  const cleaned = path.replace(/[^a-zA-Z0-9/_\.-]/g, "_");

  // If path too long, shorten ONLY the filename — never the folder prefix
  if (cleaned.length > 200) {
    const parts = cleaned.split("/");
    const file = parts.pop()!;
    const folder = parts.join("/");

    const shortened = file.slice(-120);
    return `${folder}/file_${Date.now()}_${shortened}`;
  }

  return cleaned;
}

export type UploadBufferOptions = {
  contentType?: string;
  addRandomSuffix?: boolean; // default false → overwrites allowed
};

/**
 * Upload a buffer to Vercel Blob.
 * Overwrites occur naturally when the blob key is identical.
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
    addRandomSuffix: opts.addRandomSuffix ?? false,
  });

  return blob.url;
}
