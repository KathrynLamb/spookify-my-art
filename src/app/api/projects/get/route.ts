
// src/app/api/projects/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdminApp";
import { getFirestore } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const email = searchParams.get("email");

    if (!projectId || !email) {
      return NextResponse.json(
        { ok: false, error: "Missing projectId or email" },
        { status: 400 }
      );
    }

    const db = getFirestore(getAdminApp());

    const ref = db
      .collection("users")
      .doc(email)
      .collection("projects")
      .doc(projectId);

    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const data = snap.data() || {};

    const project = {
      id: snap.id,          // 👈 this becomes projectId in the UI
      ...data,
    };

    return NextResponse.json({ ok: true, project });
  } catch (err) {
    console.error("Project get error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
