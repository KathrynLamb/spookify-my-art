import { uploadBuffer } from "@/lib/uploadBuffer";

export async function saveGeneratedImage(
  filePath: string,
  buffer: Buffer,
  contentType = "image/png"
) {
  return uploadBuffer(filePath, buffer, { contentType });
}
