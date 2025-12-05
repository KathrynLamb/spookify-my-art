// src/app/api/projects/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdminApp";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { ok: false, projects: [], error: "Missing email parameter" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(email);
    const snap = await userRef
      .collection("projects")
      .orderBy("createdAt", "desc")
      .get();

    const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ ok: true, projects });
  } catch (err) {
    console.error("🔥 Projects list error:", err);
    return NextResponse.json(
      { ok: false, projects: [], error: "Internal server error" },
      { status: 500 }
    );
  }
}
