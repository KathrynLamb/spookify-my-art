// src/app/api/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ORDER_CTX } from "@/app/api/_order-kv";
import type { OrderCtx, DraftOrderCtx } from "@/app/api/_order-kv";

// IMPORTANT: `params` is a Promise<{ orderId: string }>
// because Next's generated RouteHandlerConfig expects that shape.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  // Await the params promise
  const { orderId } = await context.params;

  const order = ORDER_CTX.get(orderId) as OrderCtx | DraftOrderCtx | undefined;

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order });
}
