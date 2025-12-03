// src/lib/uploadBuffer.ts
import { put } from "@vercel/blob";

/**
 * Vercel Blob-safe filename sanitizer that preserves folder structure.
 */
function safeFilename(path: string): string {
  // Preserve: letters, numbers, /, _, -, .
  const cleaned = path.replace(/[^a-zA-Z0-9/_\.-]/g, "_");

  // If too long, shorten the filename only
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
  addRandomSuffix?: boolean;
  allowOverwrite?: boolean;
};

/**
 * Upload a buffer to Vercel Blob.
 */
export async function uploadBuffer(
  filename: string,
  buf: Buffer,
  opts: UploadBufferOptions = {}
): Promise<string> {
  const safe = safeFilename(filename);

  // Fully typed internal options object (no `any`)
  const uploadOpts: {
    access: "public";
    contentType: string;
    addRandomSuffix?: boolean;
    allowOverwrite?: boolean;
  } = {
    access: "public",
    contentType: opts.contentType ?? "image/png",
  };

  if (opts.addRandomSuffix) uploadOpts.addRandomSuffix = opts.addRandomSuffix;
  if (opts.allowOverwrite) uploadOpts.allowOverwrite = opts.allowOverwrite;

  const blob = await put(safe, buf, uploadOpts);
  return blob.url;
}
