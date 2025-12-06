// // /app/api/paypal/create/route.ts
// import { NextResponse } from "next/server";
// import { ORDER_CTX } from "@/app/api/_order-kv";

// export const runtime = "nodejs";

// export async function POST(req: Request) {
//   try {
//     const {
//       amount,
//       currency = "GBP",
//       title = "Custom Artwork",
//       imageId,
//       fileUrl,
//       sku = "unknown",
//       vendor = "prodigi",
//     } = await req.json();

//     if (!imageId || !fileUrl) {
//       return NextResponse.json(
//         { error: "Missing imageId or fileUrl" },
//         { status: 400 }
//       );
//     }

//     /* ---------------------------------------------
//      * CHECK ENV VARS
//      * --------------------------------------------- */
//     const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
//     if (!baseUrl) {
//       console.error("❌ Missing NEXT_PUBLIC_SITE_URL");
//       return NextResponse.json(
//         { error: "Server missing NEXT_PUBLIC_SITE_URL" },
//         { status: 500 }
//       );
//     }

//     const clientId = process.env.PAYPAL_CLIENT_ID;
//     const secret = process.env.PAYPAL_CLIENT_SECRET;

//     if (!clientId || !secret) {
//       console.error("❌ Missing PayPal keys");
//       return NextResponse.json(
//         { error: "PayPal credentials missing" },
//         { status: 500 }
//       );
//     }

//     /* ---------------------------------------------
//      * SANDBOX MODE (correct)
//      * --------------------------------------------- */
//     const PAYPAL_API =
//       process.env.PAYPAL_MODE === "live"
//         ? "https://api-m.paypal.com"
//         : "https://api-m.sandbox.paypal.com";

//     const authHeader = Buffer.from(`${clientId}:${secret}`).toString("base64");

//     const invoiceId = `AI-${imageId}-${Date.now()}`;

//     const purchaseUnit = {
//       reference_id: imageId,
//       custom_id: imageId,
//       invoice_id: invoiceId,
//       amount: {
//         currency_code: currency,
//         value: amount.toFixed(2),
//         breakdown: {
//           item_total: {
//             currency_code: currency,
//             value: amount.toFixed(2),
//           },
//         },
//       },
//       items: [
//         {
//           name: title,
//           quantity: "1",
//           sku,
//           unit_amount: {
//             currency_code: currency,
//             value: amount.toFixed(2),
//           },
//           description:
//             "AI-generated custom artwork. Includes production-ready print file.",
//           image_url: fileUrl,
//         },
//       ],
//     };

//     /* ---------------------------------------------
//      * CREATE ORDER
//      * --------------------------------------------- */
//     const paypalRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
//       method: "POST",
//       headers: {
//         Authorization: `Basic ${authHeader}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         intent: "CAPTURE",
//         purchase_units: [purchaseUnit],
//         application_context: {
//           brand_name: "AI Gifts",
//           landing_page: "BILLING",
//           user_action: "PAY_NOW",
//           shipping_preference: "NO_SHIPPING",
//           return_url: `${baseUrl}/paypal/return`,
//           cancel_url: `${baseUrl}/paypal/cancel`,
//         },
//       }),
//     });

//     const data = await paypalRes.json();

//     if (!paypalRes.ok) {
//       console.error("❌ PayPal Error:", data);
//       return NextResponse.json(
//         { error: "PayPal order create failed", details: data },
//         { status: 500 }
//       );
//     }

//     type PayPalLink = { href: string; rel: string; method?: string };

//     const approve = (data.links as PayPalLink[]).find(
//       (l) => l.rel === "approve"
//     );
    

//     ORDER_CTX.set(data.id, {
//       imageId,
//       fileUrl,
//       sku,
//       vendor,
//       invoiceId,
//       status: "CREATED",
//     });

//     return NextResponse.json({
//       ok: true,
//       orderId: data.id,
//       approveUrl: approve?.href,
//     });
//   } catch (err) {
//     console.error("❌ PayPal Create Route Error:", err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }
// /app/api/paypal/create/route.ts
import { NextResponse } from "next/server";
import { ORDER_CTX } from "@/app/api/_order-kv";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const {
      amount,
      currency = "GBP",
      title = "Custom Artwork",
      imageId,
      fileUrl,
      sku = "unknown",
      vendor = "prodigi",
    } = await req.json();

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
      console.error("❌ Missing PayPal keys");
      return NextResponse.json(
        { error: "PayPal credentials missing" },
        { status: 500 }
      );
    }

    const PAYPAL_API =
      process.env.PAYPAL_MODE === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    const authHeader = Buffer.from(`${clientId}:${secret}`).toString("base64");

    const invoiceId = `AI-${imageId}-${Date.now()}`;

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
          name: title,
          quantity: "1",
          sku,
          category: "PHYSICAL_GOODS",
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
          landing_page: "BILLING",
          user_action: "PAY_NOW",
          // ✅ Let PayPal collect shipping
          shipping_preference: "GET_FROM_FILE",
          return_url: `${baseUrl}/paypal/return`,
          cancel_url: `${baseUrl}/paypal/cancel`,
        },
      }),
    });

    const data = await paypalRes.json();

    if (!paypalRes.ok) {
      console.error("❌ PayPal Error:", data);
      return NextResponse.json(
        { error: "PayPal order create failed", details: data },
        { status: 500 }
      );
    }

    type PayPalLink = { href: string; rel: string; method?: string };

    const approve = (data.links as PayPalLink[]).find(
      (l) => l.rel === "approve"
    );

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
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
