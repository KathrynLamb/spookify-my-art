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
    stateOrCounty?: string; // optional, useful for US
    email?: string;
  };
};

export type ProdigiOrderResponse =
  | {
      ok: true;
      status: number;
      data: unknown;
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

/** Trim + coerce empty/whitespace to undefined */
function clean(v?: string): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/** Quick required-field validation to fail fast with a friendly message */
function validateArgs(a: PlaceProdigiArgs): { ok: true } | { ok: false; error: string } {
  if (!clean(a.referenceId)) return { ok: false, error: "Missing referenceId" };
  if (!clean(a.sku)) return { ok: false, error: "Missing sku" };
  if (!Array.isArray(a.assets) || a.assets.length === 0)
    return { ok: false, error: "Missing assets" };

  const firstName = clean(a.shipping.firstName);
  const address1 = clean(a.shipping.address1);
  const city = clean(a.shipping.city);
  const postal = clean(a.shipping.postalCode);
  const country = clean(a.shipping.countryCode);

  if (!firstName) return { ok: false, error: "Missing shipping.firstName" };
  if (!address1) return { ok: false, error: "Missing shipping.address1" };
  if (!city) return { ok: false, error: "Missing shipping.city" };
  if (!postal) return { ok: false, error: "Missing shipping.postalCode" };
  if (!country) return { ok: false, error: "Missing shipping.countryCode" };

  return { ok: true };
}

function buildPayload(a: PlaceProdigiArgs) {
  const first = clean(a.shipping.firstName);
  const last = clean(a.shipping.lastName);

  const recipientName =
    [first, last].filter(Boolean).join(" ").trim() || "Customer";

  const line1 = clean(a.shipping.address1);
  const line2 = clean(a.shipping.address2);
  const city = clean(a.shipping.city);
  const postal = clean(a.shipping.postalCode);
  const country = clean(a.shipping.countryCode);
  const state = clean(a.shipping.stateOrCounty);
  const email = clean(a.shipping.email);

  /**
   * IMPORTANT:
   * Do NOT send line2/stateOrCounty as "".
   * Prodigi rejects empty/whitespace strings.
   */
  const address: {
    line1: string;
    line2?: string;
    postalOrZipCode: string;
    countryCode: string;
    townOrCity: string;
    stateOrCounty?: string;
  } = {
    line1: line1 ?? "",
    postalOrZipCode: postal ?? "",
    countryCode: country ?? "",
    townOrCity: city ?? "",
    ...(line2 ? { line2 } : {}),
    ...(state ? { stateOrCounty: state } : {}),
  };

  return {
    idempotencyId: a.referenceId,
    merchantReference: a.referenceId,
    shippingMethod: a.shipmentMethod || "Standard",
    // test: PRODIGI_ENV !== "live",

    recipient: {
      name: recipientName,
      email: email || "orders@aigifts.org",
      address,
    },

    items: [
      {
        sku: a.sku,
        copies: 1,
        sizing: "fillPrintArea",
        assets: a.assets.map((asset) => ({
          printArea: asset.printArea || "default",
          url: asset.url,
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

  const valid = validateArgs(args);
  if (!valid.ok) {
    return { ok: false, status: 400, error: valid.error };
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
 * HEALTH CHECK
 * ------------------------------------------------------------- */
export async function prodigiHealth(): Promise<
  | { ok: true; status: number; data: unknown }
  | { ok: false; status?: number; error?: string }
> {
  try {
    if (!PRODIGI_KEY) {
      return { ok: false, status: 500, error: "Missing PRODIGI_API_KEY" };
    }

    const res = await fetch(`${PRODIGI_BASE}/v4.0/health`, {
      headers: {
        "X-API-Key": PRODIGI_KEY,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return {
        ok: false,
        status: res.status,
        error: `Prodigi health failed ${res.status}: ${t || "(no body)"}`,
      };
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
