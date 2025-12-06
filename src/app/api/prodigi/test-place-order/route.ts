// src/app/api/prodigi/test-place-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { rebuildAssets } from "@/app/api/_rebuild-assets";
import { placeProdigiOrder } from "@/lib/prodigi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ShipmentMethod = "Budget" | "Standard" | "Express";

type Body = {
  sku?: string;
  fileUrl?: string;
  email?: string;
  shipmentMethod?: ShipmentMethod;

  // optional if you ever want to override the defaults
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
};

// Loose shape so we don't fight your lib typing
type ProdigiResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
  details?: unknown;
};

/**
 * DEV-ONLY helper to test Prodigi without PayPal.
 *
 * Expects:
 * {
 *   sku: string,
 *   fileUrl: string,
 *   email?: string,
 *   shipmentMethod?: "Budget" | "Standard" | "Express"
 * }
 *
 * Optional overrides:
 * firstName, lastName, address1, address2, city, postalCode, countryCode
 */
export async function POST(req: NextRequest) {
  try {
    // Optional safety: block in production
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { ok: false, error: "Not available in production" },
        { status: 404 }
      );
    }

    const body = (await req.json()) as Body;

    const sku = body.sku?.trim();
    const fileUrl = body.fileUrl?.trim();

    if (!sku || !fileUrl) {
      return NextResponse.json(
        { ok: false, error: "Missing sku or fileUrl" },
        { status: 400 }
      );
    }

    // 1) Build print assets
    const assets = await rebuildAssets(sku, fileUrl);

    if (!Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Asset rebuild returned empty assets" },
        { status: 400 }
      );
    }

    // 2) Safe default shipping for testing
    const shippingBase = {
      firstName: (body.firstName ?? "Test").trim(),
      lastName: (body.lastName ?? "Order").trim(),
      address1: (body.address1 ?? "10 Downing Street").trim(),
      city: (body.city ?? "London").trim(),
      postalCode: (body.postalCode ?? "SW1A 2AA").trim(),
      countryCode: (body.countryCode ?? "GB").trim(),
      email: (body.email ?? "test@example.com").trim(),
    };

    // ✅ Critical fix:
    // Only include address2 if it's a non-empty string.
    const address2 =
      typeof body.address2 === "string" && body.address2.trim().length > 0
        ? body.address2.trim()
        : undefined;

    const shipping = address2
      ? { ...shippingBase, address2 }
      : shippingBase;

    // 3) Reference id
    const referenceId = `DEV-${sku}-${Date.now()}`;

    // 4) Place Prodigi order
    const result = (await placeProdigiOrder({
      referenceId,
      sku,
      assets,
      shipmentMethod: body.shipmentMethod ?? "Standard",
      shipping,
    })) as ProdigiResult;

    if (!result?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result?.error ?? "Prodigi order failed",
          details: result?.details ?? result ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      referenceId,
      sku,
      fileUrl,
      shipmentMethod: body.shipmentMethod ?? "Standard",
      assets,
      shipping,
      prodigi: result.data ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
