import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdminApp";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const userRef = adminDb.collection("users").doc(userId);

  const userSnap = await userRef.get();
  const projectsSnap = await userRef.collection("projects").get().catch(() => null);
  const ordersSnap = await userRef.collection("orders").get().catch(() => null);

  const projects =
    projectsSnap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];

  const orders =
    ordersSnap?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [];

  return NextResponse.json({
    user: userSnap.data() ?? {},
    projects,
    orders,
  });
}
