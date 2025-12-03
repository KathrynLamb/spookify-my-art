// src/app/api/paypal/create/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ORDER_CTX } from "@/app/api/_order-kv";

const ENV = (process.env.PAYPAL_ENV ?? "sandbox").toLowerCase() === "live" ? "live" : "sandbox";
const BASE = ENV === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const APPROVE_BASE = ENV === "live"
  ? "https://www.paypal.com/checkoutnow?token="
  : "https://www.sandbox.paypal.com/checkoutnow?token=";

const CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID ||
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  "";

const CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET ||
  process.env.PAYPAL_SECRET ||
  "";

// ---- Shared helper ----
async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Missing PayPal env vars");
  }

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`PayPal auth failed: ${t || r.status}`);
  }

  const j = await r.json();
  return j.access_token;
}

// ---- Main handler ----
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      amount,
      currency,
      title,
      imageId,
      fileUrl,
      sku,
      vendor,
      draft,
    } = body;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const token = await getAccessToken();
    const value = numericAmount.toFixed(2);

    const reqUrl = new URL(req.url);
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
      reqUrl.origin;

    // const isDigital = sku === "print-at-home";

    const application_context = {
      brand_name: "Ai Gifts",
      user_action: "PAY_NOW",
      // shipping_preference: isDigital ? "NO_SHIPPING" : "GET_FROM_FILE",
      shipping_preference: "GET_FROM_FILE",
      locale: "en-GB",
      landing_page: "LOGIN",
      return_url: `${baseUrl}/post-checkout?status=approved&provider=paypal`,
      cancel_url: `${baseUrl}/post-checkout?status=cancelled&provider=paypal`,
    };

    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: imageId,
          description: title,
          amount: { currency_code: currency, value },
        },
      ],
      application_context,
    };

    const r = await fetch(`${BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const j = await r.json();
    if (!r.ok || !j.id) {
      return NextResponse.json(
        { error: j.message || "Unable to create PayPal order", details: j },
        { status: 500 }
      );
    }

    ORDER_CTX.set(j.id, { imageId, fileUrl, sku, vendor, draft });

    return NextResponse.json({
      orderID: j.id,
      approveUrl: `${APPROVE_BASE}${j.id}`,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error }, { status: 500 });
  }
  
}
