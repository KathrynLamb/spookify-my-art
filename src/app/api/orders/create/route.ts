// /app/api/orders/create/route.ts
import { NextResponse } from "next/server";
import { ORDER_CTX } from "@/app/api/_order-kv";

export async function POST(req: Request) {
  const { orderId, userEmail, imageId } = await req.json();

  ORDER_CTX.set(`order:${orderId}`, {
    
    orderId,
    userEmail,
    imageId,
    createdAt: Date.now(),
    status: "CREATED",
  });

  return NextResponse.json({ ok: true });
}
