// src/lib/authOptions.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
    async jwt({ token, account }) {
      if (account) token.uid = account.providerAccountId;
      return token;
    },
    async session({ session, token }) {
      if (token?.uid) {
        // avoid `any`: assign a fully typed object
        session.user = {
          id: token.uid,
          name: session.user?.name ?? null,
          email: session.user?.email ?? null,
          image: session.user?.image ?? null,
        };
      }
      return session;
    },
    async signIn({ user, account }) {
      try {
        const { adminDb } = await import("@/lib/firebase/admin");
        const uid = account?.providerAccountId || user.email?.replace(/\W+/g, "_");
        if (!uid) return true;

        const ref = adminDb.collection("users").doc(uid);
        const snap = await ref.get();

        if (!snap.exists) {
          await ref.set({
            name: user.name || "",
            email: user.email,
            image: user.image || null,
            createdAt: new Date().toISOString(),
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
