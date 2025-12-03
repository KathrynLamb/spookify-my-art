import { NextRequest, NextResponse } from "next/server";
import { ORDER_CTX } from "@/app/api/_order-kv";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Next.js 15 passes params as a Promise
  const { id } = await context.params;

  const order = ORDER_CTX.get(`order:${id}`);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
