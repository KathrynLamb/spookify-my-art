import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Vercel Blob token missing. Set BLOB_READ_WRITE_TOKEN in .env.local.' },
        { status: 500 }
      );
    }

    // --- 1️⃣ Handle multipart uploads (preferred path)
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Missing file' }, { status: 400 });
      }

      const arrayBuf = await file.arrayBuffer();
      const buf = Buffer.from(arrayBuf);

      const blob = await put(file.name || `spookified-${Date.now()}.jpg`, buf, {
        access: 'public',
        contentType: file.type || 'image/jpeg',
        addRandomSuffix: true,
        token,
      });

      return NextResponse.json({ url: blob.url });
    }

    // --- 2️⃣ Fallback: handle JSON base64 (legacy path)
    const body = await req.json().catch(() => null);
    const dataUrl = body?.dataUrl as string | undefined;
    const filename = (body?.filename as string) || `spookified-${Date.now()}.png`;

    if (!dataUrl) {
      return NextResponse.json({ error: 'Missing file or dataUrl' }, { status: 400 });
    }

    const match = dataUrl.match(/^data:(?<mime>image\/[a-z0-9+.\-]+);base64,(?<b64>.+)$/i);
    if (!match?.groups?.mime || !match?.groups?.b64) {
      return NextResponse.json({ error: 'Bad data URL' }, { status: 400 });
    }

    const mime = match.groups.mime;
    const buf = Buffer.from(match.groups.b64, 'base64');

    const blob = await put(filename, buf, {
      access: 'public',
      contentType: mime,
      addRandomSuffix: true,
      token,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg || 'Upload failed' }, { status: 500 });
  }
}
