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

type PayPalPayer = {
  email_address?: string;
};

type PayPalShippingAddress = {
  address_line_1?: string;
  address_line_2?: string;
  admin_area_2?: string; // city
  admin_area_1?: string; // state/county
  postal_code?: string;
  country_code?: string;
};

type PayPalShipping = {
  name?: { full_name?: string };
  address?: PayPalShippingAddress;
};

type PayPalPurchaseUnitDetails = {
  amount?: PayPalAmount;
  reference_id?: string;
  custom_id?: string;
  shipping?: PayPalShipping;
};

type PayPalOrderDetails = {
  id?: string;
  payer?: PayPalPayer;
  purchase_units?: PayPalPurchaseUnitDetails[];
  status?: string;
  [key: string]: unknown;
};

type PayPalCaptureResponse = {
  id?: string;
  payer?: PayPalPayer;
  purchase_units?: Array<{
    amount?: PayPalAmount;
    reference_id?: string;
    custom_id?: string;
  }>;
  message?: string;
  [key: string]: unknown;
};

/* -------------------- INTERNAL TYPES -------------------- */

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

type DraftOrderContext = {
  sku?: string;
  fileUrl?: string;
  previewUrl?: string;
  imageId?: string; // your projectId
  invoiceId?: string;
  shipping?: ShippingAddress;
};

/* -------------------- PAYPAL AUTH -------------------- */

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

  const json = (await r.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("PayPal missing access token");
  return json.access_token;
}

/* -------------------- GET ORDER DETAILS (for shipping) -------------------- */

async function getOrderDetails(
  orderID: string,
  token: string
): Promise<PayPalOrderDetails> {
  const r = await fetch(`${BASE}/v2/checkout/orders/${orderID}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const json = (await r.json()) as PayPalOrderDetails;

  if (!r.ok) {
    const msg =
      typeof json?.message === "string"
        ? json.message
        : "Failed to fetch PayPal order details";
    throw new Error(msg);
  }

  return json;
}

/* -------------------- MAP SHIPPING -------------------- */

function mapPayPalShippingToInternal(
  details: PayPalOrderDetails
): ShippingAddress | null {
  const pu = details.purchase_units?.[0];
  const ship = pu?.shipping;
  const addr = ship?.address;

  if (!ship || !addr) return null;

  const fullName = ship.name?.full_name?.trim() || "Customer";
  const parts = fullName.split(" ").filter(Boolean);
  const firstName = parts[0] || "Customer";
  const lastName = parts.slice(1).join(" ") || undefined;

  const address1 = addr.address_line_1?.trim() || "";
  const address2 =
    typeof addr.address_line_2 === "string" && addr.address_line_2.trim()
      ? addr.address_line_2.trim()
      : undefined;

  const city = addr.admin_area_2?.trim() || "";
  const stateOrCounty =
    typeof addr.admin_area_1 === "string" && addr.admin_area_1.trim()
      ? addr.admin_area_1.trim()
      : undefined;

  const postalCode = addr.postal_code?.trim() || "";
  const countryCode = addr.country_code?.trim() || "";

  if (!address1 || !city || !postalCode || !countryCode) return null;

  return {
    firstName,
    lastName,
    address1,
    ...(address2 ? { address2 } : {}),
    city,
    ...(stateOrCounty ? { stateOrCounty } : {}),
    postalCode,
    countryCode,
    email: details.payer?.email_address,
  };
}

/* -------------------- PRODIGI ORDER (via internal route) -------------------- */

async function placeProdigiOrder(input: {
  referenceId: string;
  assets: Array<{ url: string; printArea: string }>;
  sku?: string;
  shipping?: ShippingAddress;
}): Promise<{ ok: boolean; data?: unknown; error?: string; raw?: unknown }> {
  if (!input.sku) {
    return { ok: false, error: "Missing sku for Prodigi order" };
  }

  if (!Array.isArray(input.assets) || input.assets.length === 0) {
    return { ok: false, error: "Missing assets for Prodigi order" };
  }

  if (
    !input.shipping ||
    !input.shipping.firstName ||
    !input.shipping.address1 ||
    !input.shipping.city ||
    !input.shipping.postalCode ||
    !input.shipping.countryCode
  ) {
    return {
      ok: false,
      error:
        "Shipping address not provided. Prodigi order skipped (capture still successful).",
    };
  }

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
      shipping: input.shipping,
    }),
  });

  const prodigiJson = (await r.json().catch(() => ({}))) as
    | { ok?: boolean; error?: string; prodigi?: unknown }
    | Record<string, unknown>;

  if (!r.ok || prodigiJson?.ok === false) {
    const err =
      typeof (prodigiJson as { error?: unknown })?.error === "string"
        ? (prodigiJson as { error: string }).error
        : "Prodigi place-order failed";

    return {
      ok: false,
      error: err,
      raw: prodigiJson,
    };
  }

  return {
    ok: true,
    data:
      (prodigiJson as { prodigi?: unknown }).prodigi ?? prodigiJson,
  };
}

/* -------------------- FIRESTORE RECOVERY -------------------- */

async function recoverFromFirestore(params: {
  payerEmail: string;
  projectId: string;
}) {
  try {
    const { getAdminApp } = await import("@/lib/firebaseAdminApp");
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore(getAdminApp());

    const projSnap = await db
      .collection("users")
      .doc(params.payerEmail)
      .collection("projects")
      .doc(params.projectId)
      .get();

    const proj = (projSnap.data() ?? {}) as Record<string, unknown>;

    const fileUrl =
      (proj.finalImage as string | undefined) ??
      (proj.resultUrl as string | undefined) ??
      null;

    const previewUrl =
      (proj.mockupUrl as string | undefined) ??
      (proj.previewUrl as string | undefined) ??
      null;

    const productId = proj.productId as string | undefined;

    let sku: string | undefined;
    try {
      const { PRODUCTS } = await import("@/lib/products_gallery_jolly");

      type ProductLike = {
        productUID?: string;
        prodigiSku?: string;
      };

      const found = (PRODUCTS as ProductLike[]).find(
        (p) => p.productUID === productId
      );

      sku = found?.prodigiSku ?? found?.productUID ?? undefined;
    } catch (e) {
      console.warn("[capture] PRODUCTS lookup failed", e);
    }

    return { sku, fileUrl, previewUrl };
  } catch (e) {
    console.error("[capture] Firestore recovery failed", e);
    return { sku: undefined, fileUrl: null, previewUrl: null };
  }
}

/* -------------------- MAIN HANDLER -------------------- */

export async function POST(req: NextRequest) {
  try {
    const { orderID } = (await req.json()) as { orderID?: string };

    if (!orderID) {
      return NextResponse.json({ ok: false, error: "Missing orderID" }, { status: 400 });
    }

    /* LOAD EXISTING DRAFT CONTEXT */
    const ctx = (ORDER_CTX.get(orderID) as DraftOrderContext) ?? {};
// Variables that may change later
let { sku, fileUrl, previewUrl, imageId, shipping } = ctx;

// Variables that do NOT change
const { invoiceId } = ctx;


    /* AUTH */
    const token = await getAccessToken();

    /* ✅ GET DETAILS FIRST (best source for shipping + reference/custom ids) */
    let details: PayPalOrderDetails | null = null;
    try {
      details = await getOrderDetails(orderID, token);
    } catch (e) {
      console.warn("[capture] order details fetch failed", e);
    }

    const payerEmail =
      details?.payer?.email_address ?? null;

    /* Derive project id from details if possible */
    const detailsProjectId =
      details?.purchase_units?.[0]?.reference_id ??
      details?.purchase_units?.[0]?.custom_id ??
      null;

    if (!imageId && detailsProjectId) imageId = detailsProjectId;

    /* ✅ Prefer PayPal shipping if we didn't already have one */
    if (!shipping && details) {
      const mapped = mapPayPalShippingToInternal(details);
      if (mapped) shipping = mapped;
    }

    /* CAPTURE PAYMENT */
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
        { ok: false, error: paypal.message ?? "PayPal capture failed", details: paypal },
        { status: 500 }
      );
    }

    /* Fallback project id from capture payload */
    const captureProjectId =
      paypal.purchase_units?.[0]?.reference_id ??
      paypal.purchase_units?.[0]?.custom_id ??
      null;

    if (!imageId && captureProjectId) imageId = captureProjectId;

    /* ---------------------------------------------
     * RECOVER CRITICAL DATA IF ORDER_CTX IS EMPTY
     * --------------------------------------------- */
    if ((!sku || !fileUrl) && payerEmail && imageId) {
      const recovered = await recoverFromFirestore({
        payerEmail,
        projectId: imageId,
      });

      sku = sku ?? recovered.sku;
      fileUrl = fileUrl ?? recovered.fileUrl ?? undefined;
      previewUrl = previewUrl ?? recovered.previewUrl ?? undefined;
    }

    /* ---------------------------------------------
     * REBUILD ASSETS (guarded)
     * --------------------------------------------- */
    const assets =
      sku && fileUrl ? await rebuildAssets(sku, fileUrl) : [];

    /* ---------------------------------------------
     * PLACE PRODIGI ORDER (only if shipping valid)
     * --------------------------------------------- */
    const prodigiResult = await placeProdigiOrder({
      referenceId: orderID,
      sku,
      assets,
      shipping,
    });

    const prodigi: Record<string, unknown> = prodigiResult.ok
      ? { ok: true, data: prodigiResult.data }
      : { ok: false, error: prodigiResult.error, raw: prodigiResult.raw };

    /* ---------------------------------------------
     * STORE FINAL ORDER STATE
     * --------------------------------------------- */
    const stored: OrderCtx = {
      orderId: orderID,
      userEmail: payerEmail,

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
              createdAt: new Date().toISOString(),
              status: prodigiResult.ok ? "paid" : "paid_unfulfilled",
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
      invoiceId: invoiceId ?? null,
      shipping: shipping ?? null,
    });
  } catch (err) {
    console.error("[capture] Fatal error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
