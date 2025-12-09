// src/app/api/paypal/capture/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ORDER_CTX } from "@/app/api/_order-kv";
import type { OrderCtx } from "@/app/api/_order-kv";
import { rebuildAssets } from "@/app/api/_rebuild-assets";
import type { Asset } from "@/app/api/_rebuild-assets";
import { sendOrderAlertEmail } from "@/lib/email/orderAlerts";



/* -------------------- RUNTIME -------------------- */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------- PAYPAL CONFIG -------------------- */

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

/* -------------------- TYPES -------------------- */

type ShippingAddress = {
  firstName: string;
  lastName?: string;
  address1: string;
  address2?: string;
  city: string;
  postalCode: string;
  countryCode: string;
  stateOrCounty?: string;
  email?: string;
};
type PayPalPurchaseUnit = {
  reference_id?: string;
  custom_id?: string;

  amount?: {
    value?: string;
    currency_code?: string;
  };

  shipping?: {
    name?: { full_name?: string };
    address?: {
      address_line_1?: string;
      address_line_2?: string;
      admin_area_2?: string;
      admin_area_1?: string;
      postal_code?: string;
      country_code?: string;
    };
  };
};

type PayPalOrderDetails = {
  id?: string;
  payer?: { email_address?: string };
  purchase_units?: PayPalPurchaseUnit[];
  message?: string;
  [key: string]: unknown;
};




/* -------------------- HELPERS -------------------- */

function hasCompleteShipping(
  s: ShippingAddress | null | undefined
): s is ShippingAddress {
  return !!(
    s &&
    s.firstName &&
    s.address1 &&
    s.city &&
    s.postalCode &&
    s.countryCode
  );
}


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

  const json = await r.json();

  if (!r.ok || !json.access_token) throw new Error("PayPal authentication failed");
  return json.access_token;
}

async function getOrderDetails(id: string, token: string) {
  const r = await fetch(`${BASE}/v2/checkout/orders/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const json = (await r.json()) as PayPalOrderDetails;

  if (!r.ok) {
    const msg = typeof json.message === "string" ? json.message : "Failed to fetch PayPal order details";
    throw new Error(msg);
  }

  return json;
}

function mapShipping(details: PayPalOrderDetails): ShippingAddress | null {
  const pu = details.purchase_units?.[0];
  const ship = pu?.shipping;
  const addr = ship?.address;

  if (!ship || !addr) return null;

  const full = ship.name?.full_name?.trim() || "Customer";
  const parts = full.split(" ").filter(Boolean);

  return {
    firstName: parts[0] ?? "Customer",
    lastName: parts.slice(1).join(" ") || undefined,
    address1: addr.address_line_1?.trim() || "",
    address2: addr.address_line_2?.trim() || undefined,
    city: addr.admin_area_2?.trim() || "",
    stateOrCounty: addr.admin_area_1?.trim() || undefined,
    postalCode: addr.postal_code?.trim() || "",
    countryCode: addr.country_code?.trim() || "",
    email: details.payer?.email_address,
  };
}

async function callProdigi(
  referenceId: string,
  sku: string,
  assets: Asset[],
  shipping: ShippingAddress
)
 {
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const r = await fetch(`${origin}/api/prodigi/place-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      referenceId,
      sku,
      assets,
      shipping,
    }),
  });

  const json = await r.json().catch(() => ({}));

  if (!r.ok || json?.ok === false) {
    return { ok: false, error: json.error ?? "Prodigi place-order failed", raw: json };
  }

  return { ok: true, data: json.prodigi ?? json };
}

/* -------------------- MAIN HANDLER -------------------- */

export async function POST(req: NextRequest) {
  try {
    const { orderID } = (await req.json()) as { orderID?: string };

    if (!orderID)
      return NextResponse.json({ ok: false, error: "Missing orderID" }, { status: 400 });

    /* -------------------------------------------------------
     * 1) Attempt to load draft data from ORDER_CTX
     * ------------------------------------------------------- */
    const draft = ORDER_CTX.get(orderID) as {
      sku?: string;
      fileUrl?: string;
      previewUrl?: string;
      imageId?: string;
      invoiceId?: string;
      shipping?: ShippingAddress;
    };

    let { sku, fileUrl, previewUrl, imageId, shipping } = draft ?? {};
    const invoiceId = draft?.invoiceId;

    /* -------------------------------------------------------
     * 2) Authenticate & fetch order details (shipping + ids)
     * ------------------------------------------------------- */
    const token = await getAccessToken();
    let details: PayPalOrderDetails | null = null;

    try {
      details = await getOrderDetails(orderID, token);
    } catch (err) {
      console.warn("[capture] Could not fetch order details:", err);
    }

    const payerEmail = details?.payer?.email_address ?? null;

    const detailProjectId =
      details?.purchase_units?.[0]?.reference_id ??
      details?.purchase_units?.[0]?.custom_id ??
      null;

    if (!imageId && detailProjectId) imageId = detailProjectId;

    if (!shipping && details) {
      const mapped = mapShipping(details);
      if (mapped) shipping = mapped;
    }

    /* -------------------------------------------------------
     * 3) Capture the payment
     * ------------------------------------------------------- */
    const capRes = await fetch(`${BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const paypal = (await capRes.json()) as PayPalOrderDetails;

    if (!capRes.ok) {
      return NextResponse.json(
        { ok: false, error: paypal.message ?? "PayPal capture failed", details: paypal },
        { status: 500 }
      );
    }

    const captureProjectId =
      paypal.purchase_units?.[0]?.reference_id ??
      paypal.purchase_units?.[0]?.custom_id ??
      null;

    if (!imageId && captureProjectId) imageId = captureProjectId;

    /* -------------------------------------------------------
     * 4) If sku/fileUrl missing → recover from Firestore
     * ------------------------------------------------------- */
    if ((!sku || !fileUrl) && payerEmail && imageId) {
      try {
        const { getAdminApp } = await import("@/lib/firebaseAdminApp");
        const { getFirestore } = await import("firebase-admin/firestore");
        const db = getFirestore(getAdminApp());

        const snap = await db
          .collection("users")
          .doc(payerEmail)
          .collection("projects")
          .doc(imageId)
          .get();

        const proj = snap.data() ?? {};

        fileUrl =
          fileUrl ??
          proj.finalImage ??
          proj.resultUrl ??
          null;

        previewUrl =
          previewUrl ??
          proj.mockupUrl ??
          proj.previewUrl ??
          null;

        if (!sku) {
          const { PRODUCTS } = await import("@/lib/products_gallery_jolly");
          type ProductLike = { productUID?: string; prodigiSku?: string };

          const found = (PRODUCTS as ProductLike[]).find(
            (p) => p.productUID === proj.productId
          );
          
          sku = found?.prodigiSku ?? found?.productUID;
        }
      } catch (err) {
        console.error("[capture] Firestore recovery failed", err);
      }
    }
/* -------------------------------------------------------
 * 5) Build assets → ALWAYS required for Prodigi
 * ------------------------------------------------------- */
const skuStr =
  typeof sku === "string" && sku.trim().length > 0 ? sku.trim() : null;

const fileUrlStr =
  typeof fileUrl === "string" && fileUrl.trim().length > 0
    ? fileUrl.trim()
    : null;

const assets =
  skuStr && fileUrlStr ? await rebuildAssets(skuStr, fileUrlStr) : [];

if (!assets.length) {
  console.warn("[capture] Empty assets after rebuildAssets", {
    orderID,
    hasSku: !!skuStr,
    hasFileUrl: !!fileUrlStr,
  });
}

/* -------------------------------------------------------
 * 6) Send Prodigi order ONLY IF we truly have everything
 * ------------------------------------------------------- */
let prodigi: {
  ok: boolean;
  error?: string;
  raw?: unknown;
  data?: unknown;
} = { ok: false, error: "Not attempted", raw: null };

if (!hasCompleteShipping(shipping)) {
  prodigi = { ok: false, error: "Shipping missing or incomplete" };
} else if (!skuStr) {
  prodigi = { ok: false, error: "SKU missing (could not recover)" };
} else if (!fileUrlStr) {
  prodigi = { ok: false, error: "File URL missing (could not recover)" };
} else if (!assets.length) {
  prodigi = {
    ok: false,
    error:
      "Assets missing after rebuildAssets. Likely print area mismatch for SKU.",
  };
} else {
  // ✅ TS-safe: skuStr is string AND shipping is ShippingAddress here
  prodigi = await callProdigi(orderID, skuStr, assets, shipping);
}

    /* -------------------------------------------------------
     * 7) Store final captured order in memory
     * ------------------------------------------------------- */
    const stored: OrderCtx = {
      orderId: orderID,
      userEmail: payerEmail,
      imageId,
      sku,
      amount: paypal?.purchase_units?.[0]?.amount?.value,
      currency: paypal?.purchase_units?.[0]?.amount?.currency_code,
      paypal,
      prodigi,
      assets,
      status: "CAPTURED",
      createdAt: Date.now(),
    };

    ORDER_CTX.set(orderID, stored);

    await sendOrderAlertEmail({
      event: prodigi.ok ? "PAID_FULFILLED" : "PAID_UNFULFILLED",
      orderId: orderID,
      invoiceId: invoiceId ?? null,
      amount: stored.amount ?? null,
      currency: stored.currency ?? null,
      payerEmail: payerEmail ?? null,
      imageId: imageId ?? null,
      title: null, // if you can recover project title, add it here
      sku: sku ?? null,
      productId: null, // if you store productId in Firestore project, pull it
      packSize: null,
      fileUrl: fileUrl ?? null,
      previewUrl: previewUrl ?? null,
      mockupUrl: null,
      assets: (assets as any) ?? null,
      shipping: shipping ?? null,
      paypalRaw: paypal,
      prodigiRaw: prodigi,
    });
    

    /* -------------------------------------------------------
     * 8) Optional Firestore order log
     * ------------------------------------------------------- */
    try {
      if (payerEmail && process.env.FIRESTORE_ENABLED === "1") {
        const { getAdminApp } = await import("@/lib/firebaseAdminApp");
        const { getFirestore } = await import("firebase-admin/firestore");

        const db = getFirestore(getAdminApp());

        await db
          .collection("users")
          .doc(payerEmail)
          .collection("orders")
          .doc(orderID)
          .set(
            {
              orderId: orderID,
              sku: sku ?? null,
              fileUrl: fileUrl ?? null,
              previewUrl: previewUrl ?? null,
              assets,
              amount: stored.amount ?? null,
              currency: stored.currency ?? null,
              prodigi,
              paypal,
              shipping: shipping ?? null,
              status: prodigi.ok ? "paid" : "paid_unfulfilled",
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
      }
    } catch (err) {
      console.error("[capture] Firestore save failed:", err);
    }

    /* -------------------------------------------------------
     * 9) Final response to your return handler
     * ------------------------------------------------------- */
    return NextResponse.json({
      ok: true,
      orderId: orderID,
      paypal,
      prodigi,
      assets,
      invoiceId: invoiceId ?? null,
      shipping,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[capture] Fatal error:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
