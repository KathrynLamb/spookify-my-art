import { NextResponse, NextRequest } from "next/server";
import { ORDER_CTX } from "@/app/api/_order-kv";
import type { OrderCtx } from "@/app/api/_order-kv";
import { rebuildAssets } from "@/app/api/_rebuild-assets";

/* -------------------- RUNTIME -------------------- */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------- PAYPAL TYPES -------------------- */

type PayPalAmount = {
  value?: string;
  currency_code?: string;
};

type PayPalPurchaseUnit = {
  amount?: PayPalAmount;
};

type PayPalPayer = {
  email_address?: string;
};

type PayPalCaptureResponse = {
  id?: string;
  payer?: PayPalPayer;
  purchase_units?: PayPalPurchaseUnit[];
  message?: string;
  [key: string]: unknown;
};

/* -------------------- INTERNAL TYPES -------------------- */

type DraftOrderContext = {
  sku?: string;
  fileUrl?: string;
  previewUrl?: string;
  imageId?: string;
  invoiceId?: string;
};

/* -------------------- PAYPAL AUTH -------------------- */

// const ENV =
//   (process.env.PAYPAL_ENV ?? "sandbox").toLowerCase() === "live"
//     ? "live"
//     : "sandbox";

const ENV =
  (process.env.PAYPAL_MODE ?? "sandbox").toLowerCase() === "live"
      ? "live"
     : "sandbox";


const BASE =
  ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID ||
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  "";

const CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET ||
  process.env.PAYPAL_SECRET ||
  "";

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!r.ok) throw new Error("PayPal authentication failed");

  const json = (await r.json()) as { access_token: string };
  return json.access_token;
}

/* -------------------- PRODIGI ORDER -------------------- */

async function placeProdigiOrder(input: {
  referenceId: string;
  assets: Array<{ url: string; printArea: string }>;
  sku?: string;
  email?: string;
}): Promise<unknown> {
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const r = await fetch(`${origin}/api/prodigi/place-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      referenceId: input.referenceId,
      sku: input.sku,
      assets: input.assets,
      shipping: { email: input.email },
    }),
  });

  return r.json().catch(() => ({}));
}

/* -------------------- MAIN HANDLER -------------------- */

export async function POST(req: NextRequest) {
  try {
    const { orderID } = (await req.json()) as { orderID?: string };

    if (!orderID) {
      return NextResponse.json({ error: "Missing orderID" }, { status: 400 });
    }

    /* LOAD EXISTING DRAFT CONTEXT */
    const ctx = (ORDER_CTX.get(orderID) as DraftOrderContext) ?? {};
    const { sku, fileUrl, previewUrl, imageId, invoiceId } = ctx;

    /* CAPTURE PAYMENT */
    const token = await getAccessToken();

    const capRes = await fetch(
      `${BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paypal = (await capRes.json()) as PayPalCaptureResponse;

    if (!capRes.ok) {
      return NextResponse.json(
        { error: paypal.message ?? "PayPal capture failed", details: paypal },
        { status: 500 }
      );
    }

    /* REBUILD ASSETS */
    const assets =
      sku && fileUrl ? await rebuildAssets(sku, fileUrl) : [];

    /* PLACE PRODIGI ORDER */
    const prodigi = (await placeProdigiOrder({
      referenceId: orderID,
      sku,
      assets,
      email: paypal.payer?.email_address,
    })) as Record<string, unknown>;
    

    /* STORE FINAL ORDER STATE */
    const stored: OrderCtx = {
      orderId: orderID,
      userEmail: paypal.payer?.email_address ?? null,

      imageId,
      sku,
      amount: paypal.purchase_units?.[0]?.amount?.value,
      currency: paypal.purchase_units?.[0]?.amount?.currency_code,

      paypal,
      prodigi,
      assets,

      status: "CAPTURED",
      createdAt: Date.now(),
    };

    ORDER_CTX.set(orderID, stored);

    /* OPTIONAL: SAVE TO FIRESTORE */
    try {
      const userEmail = paypal.payer?.email_address;

      if (userEmail && process.env.FIRESTORE_ENABLED === "1") {
        const { getAdminApp } = await import("@/lib/firebaseAdminApp");
        const { getFirestore } = await import("firebase-admin/firestore");

        const db = getFirestore(getAdminApp());

        await db
          .collection("users")
          .doc(userEmail)
          .collection("orders")
          .doc(orderID)
          .set(
            {
              orderId: orderID,
              sku,
              fileUrl,
              previewUrl,
              assets,
              amount: stored.amount ?? null,
              currency: stored.currency ?? null,
              prodigi,
              paypal,
              createdAt: new Date().toISOString(),
              status: "paid",
            },
            { merge: true }
          );
      }
    } catch (err) {
      console.error("[capture] Firestore save failed:", err);
    }

    /* RESPONSE */
    return NextResponse.json({
      ok: true,
      orderId: orderID,
      paypal,
      prodigi,
      assets,
      invoiceId,
    });
  } catch (err) {
    console.error("[capture] Fatal error:", err);
    return NextResponse.json(
      { error: "Server error processing PayPal capture" },
      { status: 500 }
    );
  }
}
