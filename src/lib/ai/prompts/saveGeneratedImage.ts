
import { getStorage } from "firebase-admin/storage";

export async function saveGeneratedImage(
  imageId: string,
  buffer: Buffer
) {

  const bucket = getStorage().bucket();

  const file = bucket.file(`generated/${imageId}.jpg`);
  await file.save(buffer, {
    contentType: "image/jpeg",
  });

  return file.publicUrl();
}
