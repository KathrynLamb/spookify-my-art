import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdminApp";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      uid,
      title = "Untitled Project",
      previewUrl = null,
      productId = null,
      imageId = null,
      messages = [],
      references = [],
      createdAt = Date.now(),
    } = body;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email." }, { status: 400 });
    }

    const db = getFirestore(getAdminApp());
    const userRef = db.collection("users").doc(uid);
    const projectsCol = userRef.collection("projects");

    const newDoc = await projectsCol.add({
      title,
      previewUrl,
      productId,
      imageId,
      messages,
      references,
      createdAt: Timestamp.fromMillis(createdAt),
      updatedAt: Timestamp.fromMillis(Date.now()),
    });

    return NextResponse.json({ ok: true, id: newDoc.id });
  } catch (err) {
    console.error("Create Project Error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
