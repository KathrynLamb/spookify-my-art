import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function safeString(v: unknown) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

type OrderAlertPayload = {
  event: "PAYPAL_CREATED" | "PAYPAL_CAPTURED" | "PAID_UNFULFILLED" | "PAID_FULFILLED";
  orderId: string;
  invoiceId?: string | null;

  amount?: string | number | null;
  currency?: string | null;

  payerEmail?: string | null;
  imageId?: string | null;

  title?: string | null;

  sku?: string | null;
  productId?: string | null;
  packSize?: number | null;

  fileUrl?: string | null;
  previewUrl?: string | null;
  mockupUrl?: string | null;

  assets?: Array<{ printArea: string; url: string }> | null;

  shipping?: {
    firstName: string;
    lastName?: string;
    address1: string;
    address2?: string;
    city: string;
    stateOrCounty?: string;
    postalCode: string;
    countryCode: string;
    email?: string;
  } | null;

  paypalRaw?: unknown;
  prodigiRaw?: unknown;
};

export async function sendOrderAlertEmail(payload: OrderAlertPayload) {
  const to = process.env.ORDER_ALERT_TO_EMAIL;
  const from = process.env.ORDER_ALERT_FROM_EMAIL;

  if (!to || !from || !process.env.RESEND_API_KEY) {
    console.warn("[orderAlerts] Missing Resend config; email not sent.");
    return;
  }

  const subject = `🧾 ${payload.event} — ${payload.title ?? "Order"} — ${payload.orderId}`;

  const manualProdigi = {
    referenceId: payload.orderId,
    sku: payload.sku,
    assets: payload.assets,
    shipping: payload.shipping,
  };

  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.4;">
    <h2>${payload.event}</h2>

    <h3>Core</h3>
    <ul>
      <li><strong>Order ID:</strong> ${payload.orderId}</li>
      <li><strong>Invoice ID:</strong> ${payload.invoiceId ?? ""}</li>
      <li><strong>Amount:</strong> ${payload.amount ?? ""} ${payload.currency ?? ""}</li>
      <li><strong>Payer Email:</strong> ${payload.payerEmail ?? ""}</li>
      <li><strong>Project/Image ID:</strong> ${payload.imageId ?? ""}</li>
    </ul>

    <h3>Product</h3>
    <ul>
      <li><strong>Title:</strong> ${payload.title ?? ""}</li>
      <li><strong>SKU:</strong> ${payload.sku ?? ""}</li>
      <li><strong>Product ID:</strong> ${payload.productId ?? ""}</li>
      <li><strong>Pack Size:</strong> ${payload.packSize ?? ""}</li>
    </ul>

    <h3>Files</h3>
    <ul>
      <li><strong>Print/Master URL:</strong> ${payload.fileUrl ?? ""}</li>
      <li><strong>Preview URL:</strong> ${payload.previewUrl ?? ""}</li>
      <li><strong>Mockup URL:</strong> ${payload.mockupUrl ?? ""}</li>
    </ul>

    <h3>Assets</h3>
    <pre style="background:#0b0b0b;color:#eaeaea;padding:12px;border-radius:8px;white-space:pre-wrap;">${safeString(payload.assets ?? [])}</pre>

    <h3>Shipping</h3>
    <pre style="background:#0b0b0b;color:#eaeaea;padding:12px;border-radius:8px;white-space:pre-wrap;">${safeString(payload.shipping ?? null)}</pre>

    <h3>Manual Prodigi Payload (copy/paste)</h3>
    <pre style="background:#0b0b0b;color:#eaeaea;padding:12px;border-radius:8px;white-space:pre-wrap;">${safeString(manualProdigi)}</pre>

    <h3>Raw PayPal</h3>
    <pre style="background:#0b0b0b;color:#eaeaea;padding:12px;border-radius:8px;white-space:pre-wrap;">${safeString(payload.paypalRaw ?? null)}</pre>

    <h3>Raw Prodigi</h3>
    <pre style="background:#0b0b0b;color:#eaeaea;padding:12px;border-radius:8px;white-space:pre-wrap;">${safeString(payload.prodigiRaw ?? null)}</pre>
  </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject,
    html,
  });
}
