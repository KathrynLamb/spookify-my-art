import { DraftAsset } from "@/app/api/_order-kv";

// src/lib/prodigi.ts
type ShipMethod = "Budget" | "Standard" | "Express";

export type PlaceProdigiArgs = {
  referenceId: string;
  sku: string;
  assets: DraftAsset[];   
  shipmentMethod?: ShipMethod;
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

export type ProdigiOrderResponse =
  | {
      ok: true;
      status: number;
      data: unknown; // Prodigi returns huge varied structures
    }
  | {
      ok: false;
      status: number;
      error: string;
    }
  | {
      ok: false;
      status?: number;
      error: string;
    };

const PRODIGI_KEY = process.env.PRODIGI_API_KEY || "";
const PRODIGI_ENV =
  (process.env.PRODIGI_ENV || "").toLowerCase() ||
  (process.env.NODE_ENV === "production" ? "live" : "sandbox");

const PRODIGI_BASE =
  (process.env.PRODIGI_API_BASE &&
    process.env.PRODIGI_API_BASE.replace(/\/$/, "")) ||
  (PRODIGI_ENV === "live"
    ? "https://api.prodigi.com"
    : "https://api.sandbox.prodigi.com");

function buildPayload(a: PlaceProdigiArgs) {
  const recipientName =
    [a.shipping.firstName, a.shipping.lastName].filter(Boolean).join(" ").trim() ||
    "Customer";

  return {
    idempotencyId: a.referenceId,
    shippingMethod: a.shipmentMethod || "Standard",
    merchantReference: a.referenceId,
    recipient: {
      name: recipientName,
      email: a.shipping.email || "orders@aigifts.org",
      address: {
        line1: a.shipping.address1,
        line2: a.shipping.address2 || "",
        postalOrZipCode: a.shipping.postalCode,
        countryCode: a.shipping.countryCode,
        townOrCity: a.shipping.city,
      },
    },
    items: [
      {
        sku: a.sku,
        copies: 1,
        sizing: "fillPrintArea",
        assets: a.assets.map((url) => ({
          printArea: "default",
          url,
        })),
      },
    ],
  };
}

export async function placeProdigiOrder(
  args: PlaceProdigiArgs
): Promise<ProdigiOrderResponse> {
  if (!PRODIGI_KEY) {
    return {
      ok: false,
      status: 500,
      error: "Missing PRODIGI_API_KEY",
    };
  }

  const payload = buildPayload(args);

  const res = await fetch(`${PRODIGI_BASE}/v4.0/Orders`, {
    method: "POST",
    headers: {
      "X-API-Key": PRODIGI_KEY,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: `Prodigi error ${res.status}: ${text || "(no body)"}`,
    };
  }

  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }

  return { ok: true, status: res.status, data: json };
}

/* -------------------------------------------------------------
 * HEALTH CHECK (no any)
 * ------------------------------------------------------------- */
export async function prodigiHealth(): Promise<
  | { ok: true; status: number; data: unknown }
  | { ok: false; status?: number; error?: string }
> {
  try {
    const res = await fetch("https://api.prodigi.com/v4.0/health", {
      headers: {
        "X-API-Key": process.env.PRODIGI_API_KEY!,
      },
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: "Prodigi health failed" };
    }

    const json = (await res.json()) as unknown;

    return { ok: true, status: res.status, data: json };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
