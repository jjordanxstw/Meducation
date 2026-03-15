import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account',
        },
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === 'google') {
        token.idToken = account.id_token;
        token.googleAccessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.idToken = typeof token.idToken === 'string' ? token.idToken : undefined;
      session.googleAccessToken =
        typeof token.googleAccessToken === 'string' ? token.googleAccessToken : undefined;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
