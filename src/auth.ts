// // src/auth.ts
// import NextAuth, {
//   type Session,
//   type NextAuthConfig,
// } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import type { JWT } from "next-auth/jwt";

// export const {
//   handlers: { GET, POST },
//   auth,        // server helper
//   signIn,      // optional helper
//   signOut,     // optional helper
// } = NextAuth({
//   trustHost: true,
//   session: { strategy: "jwt" },

//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//   ],

//   pages: {
//     signIn: "/login",
//     error: "/login",
//   },

//   callbacks: {
//     // --- enrich the JWT token with Google profile data ---
//     async jwt({ token, account, profile }): Promise<JWT> {
//       if (account && profile) {
//         token.provider = account.provider;

//         const typedProfile = profile as {
//           picture?: string;
//           name?: string;
//           email?: string;
//         };

//         if (typedProfile.picture) token.picture = typedProfile.picture;
//         if (typedProfile.name) token.name = typedProfile.name;
//         if (typedProfile.email) token.email = typedProfile.email;
//       }

//       return token;
//     },

//     // --- expose those values to the session object ---
//     async session({ session, token }): Promise<Session> {
//       if (session.user) {
//         session.user.name = (token.name as string) ?? session.user.name ?? null;
//         session.user.email = (token.email as string) ?? session.user.email ?? null;
//         session.user.image = (token.picture as string) ?? session.user.image ?? null;
//       }
//       return session;
//     },
//   },

//   debug: process.env.NEXTAUTH_DEBUG === "true",
// } satisfies NextAuthConfig);
// src/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";


export async function auth() {
  return getServerSession(authOptions);
}
