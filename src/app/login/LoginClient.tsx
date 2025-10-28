// src/app/login/LoginClient.tsx (or wherever your button is)
"use client";
import { signIn } from "next-auth/react";

export default function LoginClient() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/" })} // ← avoid bouncing back to /login
      className="btn-primary"
    >
      Continue with Google
    </button>
  );
}
