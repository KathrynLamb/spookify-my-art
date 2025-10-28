// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const {
  handlers: { GET, POST },
  auth,        // <- server helper: await auth()
  signIn,      // <- optional server helper
  signOut,     // <- optional server helper
} = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" }, // no DB/adapter
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.provider = account.provider;
        token.picture = (profile as any).picture ?? token.picture;
        token.name = (profile as any).name ?? token.name;
        token.email = (profile as any).email ?? token.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        name: (token as any).name ?? session.user?.name ?? null,
        email: (token as any).email ?? session.user?.email ?? null,
        image: (token as any).picture ?? (session.user as any)?.image ?? null,
      } as any;
      return session;
    },
  },
  debug: process.env.NEXTAUTH_DEBUG === "true",
});
