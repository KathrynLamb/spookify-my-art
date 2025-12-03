// src/lib/authOptions.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { adminDb } from "./firebaseAdminApp";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  logger: {
    error(code, meta) { console.error("[next-auth:error]", code, meta); },
    warn(code) { console.warn("[next-auth:warn]", code); },
    debug(code, meta) {
      if (process.env.NEXTAUTH_DEBUG === "true") console.log("[next-auth:debug]", code, meta);
    },
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      // Include email in the JWT for convenience
      if (account && profile?.email) {
        token.email = profile.email;
      }
      return token;
    },
  
    async session({ session, token }) {
      if (token?.email) {
        session.user = {
          id: token.email,          // <-- use email as stable ID
          email: token.email,
          name: session.user?.name ?? null,
          image: session.user?.image ?? null,
        };
      }
      return session;
    },
  
    async signIn({ user }) {
      try {
        // const { adminDb } = await import("@/lib/firebase/admin");
  
        if (!user.email) return true;
  
        const ref = adminDb.collection("users").doc(user.email);
        const snap = await ref.get();
  
        if (!snap.exists) {
          await ref.set({
            email: user.email,
            name: user.name || "",
            image: user.image || null,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          });
        } else {
          await ref.update({
            name: user.name || "",
            image: user.image || null,
            lastLoginAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("🔥 Firestore user sync error (non-blocking):", e);
      }
  
      return true;
    },
  },
  

  pages: { signIn: "/login", error: "/login" },
  debug: process.env.NEXTAUTH_DEBUG === "true",
};
