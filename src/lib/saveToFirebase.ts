// lib/saveToFirebase.ts
import { getStorage } from "firebase-admin/storage";
import { getApp, initializeApp, cert } from "firebase-admin/app";

function app() {
  try {
    return getApp();
  } catch {
    return initializeApp({
      credential: cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string)
      ),
    });
  }
}

export async function savePrintBuffer(opts: {
  buf: Buffer;
  path: string; // e.g. prints/{orderId}/{sku}-front.png
  contentType: string;
  public?: boolean;
}): Promise<string> {
  const storage = getStorage(app());
  const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET!);
  const file = bucket.file(opts.path);

  await file.save(opts.buf, {
    contentType: opts.contentType,
    resumable: false,
    public: !!opts.public,
  });

  if (opts.public) {
    return `https://storage.googleapis.com/${bucket.name}/${opts.path}`;
  }

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
  });

  return url;
}
