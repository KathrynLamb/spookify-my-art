// src/app/api/print-assets/prepare/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

type PrepareReq = {
  sku?: string;
  prodigiSku?: string;
  printSpecId?: string;
  fileUrl: string;
  secondFileUrl?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PrepareReq;

    if (!body.fileUrl) {
      return NextResponse.json({ ok: false, error: 'Missing fileUrl' }, { status: 400 });
    }

    // Correct SKU selection
    const prodigiSku =
      body.prodigiSku ||
      body.sku ||
      null; // we expect "H-MUG-W" for mugs

    if (!prodigiSku) {
      return NextResponse.json({ ok: false, error: 'Missing prodigiSku' }, { status: 400 });
    }

    // Build correct Prodigi asset structure
    const assets = [
      {
        printArea: "default",
        url: body.fileUrl,
      }
    ];

    if (body.secondFileUrl) {
      assets.push({
        printArea: "back", // optional
        url: body.secondFileUrl,
      });
    }

    return NextResponse.json({
      ok: true,
      prodigiSku,
      printSpecId: body.printSpecId || null,
      assets
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
  
}
