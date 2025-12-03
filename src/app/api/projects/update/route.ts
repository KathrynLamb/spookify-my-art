import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdminApp";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, email, updates } = body;

    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing projectId." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email." }, { status: 400 });
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid updates object." }, { status: 400 });
    }

    const db = getFirestore(getAdminApp());

    const ref = db
      .collection("users")
      .doc(email)
      .collection("projects")
      .doc(projectId);

    await ref.set(
      {
        ...updates,
        updatedAt: Timestamp.fromMillis(Date.now()),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update Project Error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
