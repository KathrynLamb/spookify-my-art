// src/app/api/save-greeting/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Accepts { dataUrl: "data:image/png;base64,..." , imageId: "abc123" }
export async function POST(req: NextRequest) {
  try {
    const { dataUrl, imageId } = (await req.json()) as { dataUrl: string; imageId?: string };

    if (!dataUrl?.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ error: 'Invalid data URL' }, { status: 400 });
    }

    // Decode base64 → Buffer
    const b64 = dataUrl.split(',')[1]!;
    const buf = Buffer.from(b64, 'base64');

    const filename = `greeting/${imageId || 'unknown'}-${Date.now()}.png`;
    // Upload to Vercel Blob; requires BLOB_READ_WRITE_TOKEN in env
    const blob = await put(filename, buf, {
      access: 'public',
      contentType: 'image/png',
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
