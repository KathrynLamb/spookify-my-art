import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdminApp";
import { getFirestore } from "firebase-admin/firestore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) return NextResponse.json({ projects: [] });

  const db = getFirestore(getAdminApp());

  const snap = await db
    .collection("users")
    .doc(email)
    .collection("projects")
    .orderBy("createdAt", "desc")
    .get();

  const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return NextResponse.json({ projects });
}
