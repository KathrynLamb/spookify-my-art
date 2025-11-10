// src/app/api/print/prodigi/order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PRODIGI_SKUS } from '@/lib/prodigiCatalog';

type Address = {
  name: string;
  email?: string;
  phone?: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  stateOrCounty?: string;
  countryCode: string; // ISO 3166-1 alpha-2 e.g., "GB", "US", "IE"
};

type CreateCardOrderBody = {
  // from your Selected Product page
  variantId: keyof typeof PRODIGI_SKUS;
  imageUrl: string;            // FRONT (your generated result)
  greetingText?: string;       // optional; if present we’ll render inside-right PNG
  quantity?: number;           // default 1; must match pack size typically
  shipping: Address;
  reference?: string;          // your internal id
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateCardOrderBody;
    const variant = PRODIGI_SKUS[body.variantId];
    if (!variant) {
      return NextResponse.json({ error: 'Unknown variantId' }, { status: 400 });
    }

    const quantity = body.quantity ?? variant.packSize;
    // if pack is 10, force quantity 1 (Prodigi pack SKUs represent the pack)
    const finalQty = variant.packSize === 10 ? 1 : quantity;

    // (Optional) render inside text
    let insideRightUrl: string | undefined;
    if (body.greetingText && body.greetingText.trim().length > 0) {
      // You already have a public uploader; re-use it
      const png = await (await fetch(
        new URL('/api/render/greeting', req.nextUrl) // see helper route below
      , {
        method: 'POST',
        body: JSON.stringify({ text: body.greetingText, size: variant.px }),
        headers: { 'content-type': 'application/json' }
      })).json() as { url: string };
      insideRightUrl = png.url;
    }

    // Build order payload expected by Prodigi/Pwinty.
    // NB: Field names can vary slightly across accounts; keep this thin and adjust to your account’s schema.
    const orderPayload = {
      merchantReference: body.reference ?? `card_${Date.now()}`,
      recipient: {
        name: body.shipping.name,
        email: body.shipping.email,
        phone: body.shipping.phone,
        address: {
          line1: body.shipping.line1,
          line2: body.shipping.line2,
          postalOrZipCode: body.shipping.postalCode,
          townOrCity: body.shipping.city,
          stateOrCounty: body.shipping.stateOrCounty,
          countryCode: body.shipping.countryCode,
        },
      },
      items: [
        {
          sku: variant.sku,
          quantity: finalQty,
          // Assets: FRONT required, plus optional inside-right.
          // Do NOT put logos/QR on the back—Prodigi uses a production QR.
          assets: [
            { 
              printArea: 'front', 
              url: body.imageUrl, 
              // if you have PDFs or exact trim sizes, you can add 'md5' or 'pdf' flags here per your account’s spec
            },
            ...(insideRightUrl ? [{ printArea: 'insideRight', url: insideRightUrl }] : []),
          ],
        },
      ],
      // economy vs express; can also be left empty to let them pick cheapest available
      shippingMethod: 'Standard',
      // webhook to receive status changes:
      callbackUrl: `${req.nextUrl.origin}/api/print/prodigi/webhook`,
      // optional: who’s sending
      sender: { name: process.env.BRAND_FROM_NAME ?? 'AI Gifts', email: process.env.BRAND_FROM_EMAIL ?? undefined },
    };

    const resp = await fetch(
      `${process.env.PRODIGI_API_BASE ?? 'https://api.prodigi.com'}/orders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.PRODIGI_API_KEY ?? '',
        },
        body: JSON.stringify(orderPayload),
      }
    );

    const text = await resp.text();
    if (!resp.ok) {
      return NextResponse.json({ error: `Prodigi error ${resp.status}`, detail: text }, { status: 502 });
    }
    const json = JSON.parse(text);
    return NextResponse.json({ ok: true, order: json });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  
}
