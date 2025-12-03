// src/app/api/user/route.ts
import { NextResponse } from "next/server";
// ⬇️ Adjust this import to wherever your authOptions live

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        email: session.user.email,
        name: session.user.name ?? null,
      },
    });
  } catch (err) {
    console.error("/api/user error", err);
    // Still return JSON so the client never tries to parse HTML
    return NextResponse.json({ user: null, error: "SERVER_ERROR" }, { status: 500 });
  }
}
