export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
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
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NEXTAUTH_DEBUG === "true",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
