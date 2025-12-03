import { NextRequest, NextResponse } from "next/server";
import { ORDER_CTX } from "@/app/api/_order-kv";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  // Await the promised params (required in Next.js 15+)
  const { orderId } = await context.params;

  const order = ORDER_CTX.get(`order:${orderId}`);

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
