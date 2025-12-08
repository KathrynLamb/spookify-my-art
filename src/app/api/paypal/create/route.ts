// src/app/api/paypal/create/route.ts
import { NextResponse } from "next/server";
import { ORDER_CTX } from "@/app/api/_order-kv";

export const runtime = "nodejs";

function toMoneyString(n: number) {
  // PayPal expects string money values with 2 decimals
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function calcItemTotal(
  items: Array<{ unit_amount: { value: string }; quantity: string }>
) {
  const total = items.reduce((sum, i) => {
    const unit = Number(i.unit_amount.value);
    const qty = Number(i.quantity);
    return sum + unit * qty;
  }, 0);

  return toMoneyString(total);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const amountRaw = body.amount;
    const amount =
      typeof amountRaw === "number"
        ? amountRaw
        : typeof amountRaw === "string"
        ? Number(amountRaw)
        : NaN;

    const currency = body.currency ?? "GBP";
    const title = body.title ?? "Custom Artwork";
    const imageId = body.imageId;
    const fileUrl = body.fileUrl;
    const sku = body.sku ?? "unknown";
    const vendor = body.vendor ?? "prodigi";

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid amount" },
        { status: 400 }
      );
    }

    if (!imageId || !fileUrl) {
      return NextResponse.json(
        { error: "Missing imageId or fileUrl" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      console.error("❌ Missing NEXT_PUBLIC_SITE_URL");
      return NextResponse.json(
        { error: "Server missing NEXT_PUBLIC_SITE_URL" },
        { status: 500 }
      );
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !secret) {
      console.error("❌ Missing PayPal credentials");
      return NextResponse.json(
        { error: "PayPal keys missing" },
        { status: 500 }
      );
    }

    const PAYPAL_API =
      (process.env.PAYPAL_MODE ?? "sandbox") === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    const authHeader = Buffer.from(`${clientId}:${secret}`).toString("base64");

    const invoiceId = `AI-${imageId}-${Date.now()}`;

    // ------------------------------------------------------------
    // ✅ Build items FIRST
    // ------------------------------------------------------------
    const items = [
      {
        name: title,
        quantity: "1",
        sku,
        category: "PHYSICAL_GOODS",
        unit_amount: {
          currency_code: currency,
          value: toMoneyString(amount),
        },
        description:
          "AI-generated custom artwork. Includes production-ready print file.",
        // NOTE: PayPal Orders v2 doesn't officially document `image_url` here,
        // but leaving it won't break the item_total requirement.
        image_url: fileUrl,
      },
    ];

    // ✅ REQUIRED when `items` are present
    const itemTotal = calcItemTotal(
      items.map((i) => ({
        unit_amount: { value: i.unit_amount.value },
        quantity: i.quantity,
      }))
    );

    const purchaseUnit = {
      reference_id: imageId,
      custom_id: imageId,
      invoice_id: invoiceId,
      amount: {
        currency_code: currency,
        value: itemTotal,
        breakdown: {
          item_total: {
            currency_code: currency,
            value: itemTotal,
          },
          // If you later add shipping/tax, add them here and ensure
          // the sum matches amount.value exactly.
        },
      },
      items,
    };

    const paypalRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [purchaseUnit],
        application_context: {
          brand_name: "AI Gifts",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          shipping_preference: "GET_FROM_FILE", // keep for Prodigi
          return_url: `${baseUrl}/paypal/return`,
          cancel_url: `${baseUrl}/paypal/cancel`,
        },
      }),
    });

    const data = await paypalRes.json();

    if (!paypalRes.ok) {
      console.error("❌ PayPal order error:", data);
      return NextResponse.json(
        { error: "PayPal order creation failed", details: data },
        { status: 500 }
      );
    }

    type PayPalLink = { href: string; rel: string; method?: string };

    const approve = (data.links as PayPalLink[]).find(
      (l) => l.rel === "approve"
    );

    // Save draft order context
    ORDER_CTX.set(data.id, {
      imageId,
      fileUrl,
      sku,
      vendor,
      invoiceId,
      status: "CREATED",
    });

    return NextResponse.json({
      ok: true,
      orderId: data.id,
      approveUrl: approve?.href,
    });
  } catch (err) {
    console.error("❌ PayPal Create Route Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
