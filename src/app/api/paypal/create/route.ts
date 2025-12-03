// /app/api/paypal/create/route.ts
import { NextResponse } from "next/server";
import { ORDER_CTX } from "@/app/api/_order-kv";

export const runtime = "nodejs";

/* ---------------------------------------------
 * TYPES
 * --------------------------------------------- */

type CreateOrderBody = {
  amount: number;
  currency?: string;
  title?: string;
  imageId: string;
  fileUrl: string;
  sku?: string;
  vendor?: string;
};

type PayPalLink = {
  href: string;
  rel: string;
  method: string;
};

type PayPalCreateResponse = {
  id: string;
  links: PayPalLink[];
};

/* ---------------------------------------------
 * MAIN ROUTE
 * --------------------------------------------- */

export async function POST(req: Request) {
  try {
    const {
      amount,
      currency = "GBP",
      title,
      imageId,
      fileUrl,
      sku,
      vendor = "prodigi",
    } = (await req.json()) as CreateOrderBody;

    if (!imageId || !fileUrl) {
      return NextResponse.json(
        { error: "Missing imageId or fileUrl" },
        { status: 400 }
      );
    }

    /* ---------------------------------------------
     * PAYPAL AUTH
     * --------------------------------------------- */
    const clientId = process.env.PAYPAL_CLIENT_ID!;
    const secret = process.env.PAYPAL_SECRET!;
    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

    const invoiceId = `AI-${imageId}-${Date.now()}`;

    /* ---------------------------------------------
     * PURCHASE UNIT
     * --------------------------------------------- */
    const purchaseUnit = {
      reference_id: imageId,
      custom_id: imageId,
      invoice_id: invoiceId,

      amount: {
        currency_code: currency,
        value: amount.toFixed(2),
        breakdown: {
          item_total: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      },

      items: [
        {
          name: title ?? "Custom Artwork",
          quantity: "1",
          sku,
          unit_amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description:
            "AI-generated custom artwork. Includes production-ready print file.",
          image_url: fileUrl,
        },
      ],
    };

    /* ---------------------------------------------
     * CREATE PAYPAL ORDER
     * --------------------------------------------- */
    const response = await fetch(
      "https://api-m.paypal.com/v2/checkout/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [purchaseUnit],
          application_context: {
            brand_name: "AI Gifts",
            landing_page: "BILLING", // Guest checkout enabled
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: `${process.env.NEXT_PUBLIC_URL}/paypal/return`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/paypal/cancel`,
          },
        }),
      }
    );

    const json = (await response.json()) as PayPalCreateResponse;

    if (!response.ok) {
      console.error("PayPal Order Create Error:", json);
      return NextResponse.json(
        { error: "PayPal order create failed", details: json },
        { status: 500 }
      );
    }

    /* ---------------------------------------------
     * SAVE ORDER CONTEXT
     * --------------------------------------------- */
    ORDER_CTX.set(json.id, {
      imageId,
      fileUrl,
      sku,
      vendor,
      invoiceId,
      status: "CREATED",
    });

    /* ---------------------------------------------
     * FIND APPROVAL LINK (strict typed)
     * --------------------------------------------- */
    const approveLink = json.links.find(
      (l: PayPalLink) => l.rel === "approve"
    );

    return NextResponse.json({
      orderId: json.id,
      invoiceId,
      approveUrl: approveLink?.href,
    });
  } catch (err) {
    console.error("PayPal Create Route Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
