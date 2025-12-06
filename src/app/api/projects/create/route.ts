import { NextResponse } from "next/server";

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdminApp";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      title,
      previewUrl,
      productId,
      imageId,
      createdAt,
      messages = [],
      references = [],
    } = body;

    if (!email) {
      console.error("❌ Missing email");
      return NextResponse.json(
        { ok: false, error: "Missing email" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(email);
    const projectsCol = userRef.collection("projects");

    // ✅ THIS OBJECT IS VALID — NO EXTRA BRACE
    const newDoc = await projectsCol.add({
      title: title || "Untitled Project",
      previewUrl: previewUrl || null,
      productId: productId || null,
      imageId: imageId || null,
      createdAt: Timestamp.fromMillis(createdAt || Date.now()),
      updatedAt: Timestamp.fromMillis(Date.now()),
      messages: Array.isArray(messages) ? messages : [],
      references: Array.isArray(references) ? references : [],
    });

    return NextResponse.json({ ok: true, id: newDoc.id });
  } catch (error) {
    console.error("Create Project Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
