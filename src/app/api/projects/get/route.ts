import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdminApp";

export const runtime = "nodejs";

export async function GET(req: Request) {
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

    const ref = adminDb
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

    const data = snap.data();

    return NextResponse.json({
      ok: true,
      project: {
        id: projectId,
        ...data,
      },
    });
  } catch (err) {
    console.error("GET PROJECT ERROR", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
