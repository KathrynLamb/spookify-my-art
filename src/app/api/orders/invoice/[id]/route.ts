// src/app/api/orders/invoice/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ORDER_CTX } from "@/app/api/_order-kv";
import type { OrderCtx, DraftOrderCtx } from "@/app/api/_order-kv";

// IMPORTANT: params is a Promise<{ id: string }>
// to satisfy RouteHandlerConfig in .next/types
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Next.js 15 passes params as a Promise
  const { id } = await context.params;

  // We store orders in ORDER_CTX keyed by the raw order ID
  // (e.g. PayPal orderID), so no "order:" prefix here.
  const order = ORDER_CTX.get(id) as OrderCtx | DraftOrderCtx | undefined;

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // You can wrap with { ok: true, order } if you prefer,
  // but the validator only cares about the function signature.
  return NextResponse.json(order);
}
