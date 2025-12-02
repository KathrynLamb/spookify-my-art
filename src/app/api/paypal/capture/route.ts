// src/app/api/paypal/capture/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ORDER_CTX } from "@/app/api/_order-kv";

/* -------------------------------------------------------------
 * LIGHTWEIGHT TYPES (fixes "any" without heavy schemas)
 * ------------------------------------------------------------- */
type PayPalCaptureResponse = {
  message?: string;
  purchase_units?: Array<{
    shipping?: {
      name?: { full_name?: string };
      address?: {
        address_line_1?: string;
        address_line_2?: string;
        line1?: string;
        admin_area_2?: string;
        postal_code?: string;
        country_code?: string;
      };
    };
  }>;
  payer?: { email_address?: string };
  [key: string]: unknown; // allow extra PayPal fields
};

type DraftAsset = {
  printArea: string;
  url: string;
};

type DraftInfo = {
  prodigiSku: string;
  printSpecId?: string;
  assets: DraftAsset[];
};


type OrderContext = {
  draft?: DraftInfo;
  sku?: string;
  fileUrl?: string;
  vendor?: string;
  [key: string]: unknown;
};

type ParsedState = {
  sku?: string;
  fileUrl?: string;
  vendor?: string;
};

type CaptureBody = {
  orderID: string;
  state?: string;
  sku?: string;
  fileUrl?: string;
};

/* -------------------------------------------------------------
 * AUTH
 * ------------------------------------------------------------- */
const ENV =
  (process.env.PAYPAL_ENV ?? "sandbox").toLowerCase() === "live"
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
  process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET || "";

async function getAccessToken(): Promise<string> {
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

  if (!r.ok) throw new Error(`PayPal auth failed: ${r.status}`);

  const json = (await r.json()) as { access_token: string };
  return json.access_token;
}

/* -------------------------------------------------------------
 * MAIN ROUTE
 * ------------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    const { orderID, state, sku: skuFallback, fileUrl: fileFallback } =
      (await req.json()) as CaptureBody;

    if (!orderID) {
      return NextResponse.json(
        { error: "Missing orderID" },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------------
     * 1) Capture payment
     * ------------------------------------------------------------- */
    const token = await getAccessToken();
    const capRes = await fetch(
      `${BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const paypal = (await capRes.json()) as PayPalCaptureResponse;

    if (!capRes.ok) {
      return NextResponse.json(
        { error: paypal.message || "PayPal capture failed", details: paypal },
        { status: 500 }
      );
    }

    /* -------------------------------------------------------------
     * 2) Retrieve server-state from KV
     * ------------------------------------------------------------- */
    const ctx =
      ((ORDER_CTX.get(orderID) as unknown) as OrderContext) || {};

    let draft = ctx.draft;
    let sku = ctx.sku;
    let fileUrl = ctx.fileUrl;

    const vendor = ctx.vendor || "prodigi";

    /* -------------------------------------------------------------
     * Fallback: decode `state` or use POST fallback fields
     * ------------------------------------------------------------- */
    if (!draft) {
      let parsed: ParsedState = {};

      try {
        if (state) {
          const decoded = Buffer.from(state, "base64url").toString("utf8");
          parsed = JSON.parse(decoded) as ParsedState;
        }
      } catch {
        // safe ignore
      }

      sku = sku || parsed.sku || skuFallback;
      fileUrl = fileUrl || parsed.fileUrl || fileFallback;

      /* -------------------------------------------------------------
       * Rebuild assets if SKU + fileUrl known
       * ------------------------------------------------------------- */
      if (sku && fileUrl) {
        const origin =
          process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
          (process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "") ||
          "http://localhost:3000";

        const prepRes = await fetch(`${origin}/api/print-assets/prepare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sku, fileUrl }),
        });

        const prep = (await prepRes.json().catch(() => ({}))) as {
          ok?: boolean;
          assets?: DraftAsset[];

        };

        if (
          prepRes.ok &&
          prep.ok &&
          Array.isArray(prep.assets) &&
          prep.assets.length > 0
        ) {
          draft = {
            prodigiSku: sku,
            printSpecId: undefined,
            assets: prep.assets as DraftAsset[],   // ensure correct type
          };
        
          ORDER_CTX.set(orderID, {
            ...ctx,
            draft,
            sku,
            fileUrl,
            vendor,
          });
        
        
        } else {
          console.warn(
            "[paypal.capture] could not regenerate assets",
            prepRes.status,
            prep
          );
        }
      } else {
        console.warn(
          "[paypal.capture] missing draft and no sku/fileUrl to rebuild"
        );
      }
    }

    /* -------------------------------------------------------------
     * 3) Place Prodigi order
     * ------------------------------------------------------------- */
    let prodigi: unknown = null;

    if (vendor === "prodigi" && draft?.prodigiSku && draft.assets.length) {
      const origin =
        process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "") ||
        "http://localhost:3000";

      // best-effort PayPal → shipping mapping
      const pu = paypal.purchase_units?.[0] ?? {};
      const shipping = pu.shipping ?? {};
      const addr = shipping.address ?? {};
      const fullName = shipping.name?.full_name ?? "";

      const [first, ...rest] = fullName.split(/\s+/).filter(Boolean);
      const last = rest.join(" ");

      const placeRes = await fetch(
        `${origin}/api/prodigi/place-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referenceId: orderID,
            sku: draft.prodigiSku,
            assets: draft.assets,
            shipmentMethod: "Standard",
            shipping: {
              firstName: first || "Customer",
              lastName: last || "",
              address1: addr.address_line_1 || addr.line1 || "Address",
              address2: addr.address_line_2 || "",
              city: addr.admin_area_2 || "City",
              postalCode: addr.postal_code || "0000",
              countryCode: addr.country_code || "GB",
              email: paypal.payer?.email_address || undefined,
            },
          }),
        }
      );

      const placeJson = (await placeRes
        .json()
        .catch(() => ({}))) as unknown;

  // replace this:
// if (!placeRes.ok || (placeJson as any)?.ok === false) {

// with this:
const isProdigiError =
typeof placeJson === "object" &&
placeJson !== null &&
"ok" in placeJson &&
(placeJson as { ok: unknown }).ok === false;

if (!placeRes.ok || isProdigiError) {
return NextResponse.json(
  {
    ok: true,
    paypal,
    prodigi: placeJson,
    note: "Payment captured; fulfillment failed",
  },
  { status: 200 }
);
}


      prodigi = placeJson;
    }

    /* -------------------------------------------------------------
     * DONE
     * ------------------------------------------------------------- */
    return NextResponse.json({ ok: true, paypal, prodigi });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message ?? String(error) },
      { status: 500 }
    );
  }
}
