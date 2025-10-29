// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import NextAuth, { type NextAuthOptions, type DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// import type { JWT } from "next-auth/jwt";

/* -------------------------------------------------------------------------- */
/*                               Type Extension                               */
/* -------------------------------------------------------------------------- */

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
  }
}

/* -------------------------------------------------------------------------- */
/*                              Auth Configuration                            */
/* -------------------------------------------------------------------------- */

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    /* ---------------------- JWT: add UID to the token ---------------------- */
    async jwt({ token, account }) {
      if (account) {
        token.uid = account.providerAccountId; // Google’s unique user ID
      }
      return token;
    },

    /* ---------------------- Session: expose UID to client ---------------------- */
    async session({ session, token }) {
      if (token?.uid) {
        session.user.id = token.uid;
      }
      return session;
    },

    /* ---------------------- Sync to Firestore on sign-in ---------------------- */
    async signIn({ user, account }) {
      try {
        const { adminDb } = await import("@/lib/firebase/admin");

        // Use UID if available, fallback to sanitized email
        const uid = account?.providerAccountId || user.email?.replace(/\W+/g, "_");
        if (!uid) return false;

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
          // Update if profile changed
          await ref.update({
            name: user.name || "",
            image: user.image || null,
            lastLoginAt: new Date().toISOString(),
          });
        }

        return true;
      } catch (err) {
        console.error("🔥 Firestore user sync error:", err);
        return false;
      }
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  debug: process.env.NEXTAUTH_DEBUG === "true",
};

/* -------------------------------------------------------------------------- */
/*                                 Export Handlers                            */
/* -------------------------------------------------------------------------- */

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
