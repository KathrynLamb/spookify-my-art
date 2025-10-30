// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import NextAuth, { type NextAuthOptions, type DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null };
  }
}
declare module "next-auth/jwt" { interface JWT { uid?: string } }

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,             // ✅ explicit, fixes NO_SECRET in prod
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  logger: {                                        // ✅ surface the real error in Vercel logs
    error(code, meta) { console.error("[next-auth:error]", code, meta); },
    warn(code) { console.warn("[next-auth:warn]", code); },
    debug(code, meta) { if (process.env.NEXTAUTH_DEBUG === "true") console.log("[next-auth:debug]", code, meta); },
  },

  callbacks: {
    async jwt({ token, account }) {
      if (account) token.uid = account.providerAccountId;
      return token;
    },
    async session({ session, token }) {
      if (token?.uid) session.user.id = token.uid;
      return session;
    },

    // ✅ Never block sign-in on Firestore errors (return true even on failure)
    async signIn({ user, account }) {
      try {
        const { adminDb } = await import("@/lib/firebase/admin");
        const uid = account?.providerAccountId || user.email?.replace(/\W+/g, "_");
        if (!uid) return true; // let them in

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
        // DO NOT return false/throw — that turns into ?error=OAuthSignin
      }
      return true;
    },
  },

  pages: { signIn: "/login", error: "/login" },
  debug: process.env.NEXTAUTH_DEBUG === "true",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
