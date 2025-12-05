// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebaseAdminApp";

export async function GET(
  req: NextRequest,
  // IMPORTANT: params is a Promise<{ id: string }>
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15 passes params as a Promise
    const { id } = await context.params;

    const db = getFirestore(getAdminApp());

    const userEmail = req.nextUrl.searchParams.get("email");
    if (!userEmail) {
      return NextResponse.json(
        { ok: false, error: "Email missing" },
        { status: 400 }
      );
    }

    const doc = await db
      .collection("users")
      .doc(userEmail)
      .collection("projects")
      .doc(id)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      project: { id: doc.id, ...doc.data() },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}