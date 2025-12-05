// src/app/api/projects/delete/route.ts
import { adminDb } from "@/lib/firebaseAdminApp";
import { NextResponse } from "next/server";
// ✅ adjust this import to your project


export const runtime = "nodejs";

type DeleteProjectBody = {
  projectId?: string;
  email?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DeleteProjectBody;
    const projectId = body.projectId;
    const email = body.email;

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


    await ref.delete();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Delete project error", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
