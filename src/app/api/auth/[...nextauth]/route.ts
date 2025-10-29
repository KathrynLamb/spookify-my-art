// // app/api/auth/[...nextauth]/route.ts
// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// import NextAuth, { type NextAuthOptions, type DefaultSession } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";

// /* -------------------------------------------------------------------------- */
// /*                               Type Extension                               */
// /* -------------------------------------------------------------------------- */
// declare module "next-auth" {
//   interface Session extends DefaultSession {
//     user: {
//       id: string;
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//     };
//   }
// }

// declare module "next-auth/jwt" {
//   interface JWT {
//     uid?: string;
//   }
// }

// /* -------------------------------------------------------------------------- */
// /*                              Auth Configuration                            */
// /* -------------------------------------------------------------------------- */
// export const authOptions: NextAuthOptions = {
//   session: { strategy: "jwt" },

//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//   ],

//   callbacks: {
//     /** Ensure a stable uid is always present on the JWT */
//     async jwt({ token, account }) {
//       // token.sub is the provider user id; persist it as uid
//       token.uid ??= token.sub ?? account?.providerAccountId;
//       return token;
//     },

//     /** Expose uid on the session */
//     async session({ session, token }) {
//       if (token?.uid) {
//         // make sure session.user exists (it does for OAuth)
//         session.user.id = token.uid;
//       }
//       return session;
//     },

//     /** Best-effort Firestore sync (don't block sign-in on failure) */
//     async signIn({ user, account }) {
//       try {
//         const { adminDb } = await import("@/lib/firebase/admin");

//         const uid = account?.providerAccountId ?? user.email?.replace(/\W+/g, "_");
//         if (!uid) return true; // allow sign-in even if we can't compute an id

//         await adminDb
//           .collection("users")
//           .doc(uid)
//           .set(
//             {
//               name: user.name || "",
//               email: user.email ?? null,
//               image: user.image ?? null,
//               lastLoginAt: new Date().toISOString(),
//               // createdAt will be preserved if present
//               createdAt: new Date().toISOString(),
//             },
//             { merge: true }
//           );

//         return true;
//       } catch (err) {
//         console.error("🔥 Firestore user sync error:", err);
//         // Do not block sign-in because of a DB hiccup
//         return true;
//       }
//     },
//   },

//   pages: {
//     signIn: "/login",
//     error: "/login",
//   },

//   debug: process.env.NEXTAUTH_DEBUG === "true",
// };

// /* -------------------------------------------------------------------------- */
// /*                                 Export Handlers                            */
// /* -------------------------------------------------------------------------- */
// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import NextAuth, { type NextAuthOptions, type DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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

export const authOptions: NextAuthOptions = {
  /** ✅ explicitly pass secret so v4 never complains in prod */
  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      if (account) token.uid = account.providerAccountId;
      return token;
    },
    async session({ session, token }) {
      if (token?.uid) session.user.id = token.uid;
      return session;
    },
    async signIn({ user, account }) {
      try {
        const { adminDb } = await import("@/lib/firebase/admin");
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
