import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { env, allowedEmailDomains } from './env';

// Validates required server env at import time (throws if NEXTAUTH_SECRET,
// GOOGLE_CLIENT_SECRET, etc. are missing) — see lib/env.ts.

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:
        process.env.GOOGLE_CLIENT_ID ?? env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
      // Enforce PKCE + state on the OAuth code flow (2.1).
      checks: ['pkce', 'state'],
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
    // Align with the backend refresh token (7 days) so the session lifetime is
    // consistent end-to-end; the backend access cookie renews silently via
    // /auth/refresh within this window.
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  callbacks: {
    // Defense-in-depth domain allowlist before the backend ever sees the token.
    async signIn({ user }) {
      const domains = allowedEmailDomains();
      if (domains.length === 0) {
        return true; // no allowlist configured -> defer entirely to backend
      }
      const email = user.email?.toLowerCase() ?? '';
      return domains.some((domain) => email.endsWith(domain));
    },
    async jwt({ token, account }) {
      if (account?.provider === 'google') {
        token.idToken = account.id_token;
        // Track expiry (seconds) so the client can pre-empt staleness.
        token.backendTokenExpiry = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose only what the client needs. The raw Google access_token is
      // deliberately never surfaced to the client.
      session.idToken = typeof token.idToken === 'string' ? token.idToken : undefined;
      session.backendTokenExpiry =
        typeof token.backendTokenExpiry === 'number' ? token.backendTokenExpiry : undefined;
      return session;
    },
  },
  secret: env.NEXTAUTH_SECRET,
};
