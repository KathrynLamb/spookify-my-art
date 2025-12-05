// src/app/api/orders/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdminApp";

export const runtime = "nodejs";

type HasToMillis = { toMillis: () => number };
type HasToDate = { toDate: () => Date };

function hasToMillis(value: unknown): value is HasToMillis {
  return (
    !!value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as HasToMillis).toMillis === "function"
  );
}

function hasToDate(value: unknown): value is HasToDate {
  return (
    !!value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as HasToDate).toDate === "function"
  );
}

function toMillis(value: unknown): number | null {
  if (hasToMillis(value)) return value.toMillis();
  if (hasToDate(value)) return value.toDate().getTime();

  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ ok: true, orders: [] });
    }

    const userRef = adminDb.collection("users").doc(email);

    const snap = await userRef
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const orders = snap.docs.map((doc) => {
      const data = doc.data() ?? {};

      return {
        id: doc.id,
        orderId: (data.orderId as string | undefined) ?? doc.id,
        status: (data.status as string | undefined) ?? "unknown",
        amount: (data.amount as number | undefined) ?? null,
        currency: (data.currency as string | undefined) ?? "GBP",
        previewUrl: (data.previewUrl as string | undefined) ?? null,
        createdAt: toMillis(data.createdAt),
        updatedAt: toMillis(data.updatedAt),
      };
    });

    return NextResponse.json({ ok: true, orders });
  } catch (err: unknown) {
    console.error("🔥 Orders list error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json(
      { ok: false, orders: [], error: message },
      { status: 500 },
    );
  }
}
