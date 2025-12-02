// src/app/api/prodigi/place-order/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { placeProdigiOrder } from "@/lib/prodigi";

type Asset = { printArea: string; url: string };

type Req = {
  referenceId: string;
  sku: string;
  assets: Asset[];
  shipmentMethod?: "Budget" | "Standard" | "Express";
  shipping: {
    firstName: string;
    lastName?: string;
    address1: string;
    address2?: string;
    city: string;
    postalCode: string;
    countryCode: string;
    email?: string;
  };
};

type UnknownError = { message?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Req;

    if (!body.referenceId || !body.sku) {
      return NextResponse.json(
        { ok: false, error: "Missing referenceId or sku" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.assets) || body.assets.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Missing assets" },
        { status: 400 }
      );
    }

    const result = await placeProdigiOrder({
      referenceId: body.referenceId,
      sku: body.sku,
      assets: body.assets,   // now correctly typed
      shipmentMethod: body.shipmentMethod || "Standard",
      shipping: {
        firstName: body.shipping.firstName,
        lastName: body.shipping.lastName,
        address1: body.shipping.address1,
        address2: body.shipping.address2,
        city: body.shipping.city,
        postalCode: body.shipping.postalCode,
        countryCode: body.shipping.countryCode,
        email: body.shipping.email,
      },
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, prodigi: result.data });
  } catch (err) {
    const e = err as UnknownError;
    return NextResponse.json(
      { ok: false, error: e.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
