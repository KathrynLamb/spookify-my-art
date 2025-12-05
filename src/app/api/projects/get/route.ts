// import { NextRequest, NextResponse } from "next/server";
// import { adminDb } from "@/lib/firebaseAdminApp";

// export const runtime = "nodejs";

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const email = searchParams.get("email");
//     console.log('email', email)
//     if (!email) {
//       return NextResponse.json(
//         { ok: false, error: "Missing email parameter" },
//         { status: 400 }
//       );
//     }

//     const userRef = adminDb.collection("users").doc(email);
//     console.log('userRef', userRef)


//     let snap;
//     try {
//       snap = await userRef
//         .collection("projects")
//         .orderBy("createdAt", "desc")
//         .get();
//         console.log("SNAP", snap)
//     } catch (err) {
//       console.warn("⚠️ createdAt missing — falling back", err);
//       snap = await userRef.collection("projects").get();
//     }

//     const projects = snap.docs.map((doc) => {
//       const data = doc.data() ?? {};

//       const toMillis = (v: unknown): number | null => {
//         if (v?.toMillis) return v.toMillis();
//         if (typeof v === "number") return v;
//         if (typeof v === "string") {
//           const t = Date.parse(v);
//           return Number.isNaN(t) ? null : t;
//         }
//         return null;
//       };

//       return {
//         id: doc.id,
//         title: data.title ?? "Untitled Project",
//         previewUrl: data.previewUrl ?? null,
//         originalUrl: data.originalUrl ?? null,
//         productId: data.productId ?? null,
//         createdAt: toMillis(data.createdAt),
//         updatedAt: toMillis(data.updatedAt),
//       };
//     });

//     return NextResponse.json({ ok: true, projects });
//   } catch (err) {
//     console.error("🔥 Projects list error:", err);
//     return NextResponse.json(
//       { ok: false, error: "Internal error listing projects" },
//       { status: 500 }
//     );
//   }
// }
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
