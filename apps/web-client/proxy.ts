import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Public routes that do not require an authenticated session.
const publicRoutes = new Set(['/login', '/auth/sync']);

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.has(pathname);
}

/**
 * Proxy function for Next.js 16+.
 * Single responsibility now that the app is English-only: authentication
 * (session validation and route protection).
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip proxy for API routes, static files, and Next.js internals.
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isPublic = isPublicRoute(pathname);

  // Not authenticated and trying to reach a protected route → login.
  if (!token && !isPublic) {
    const loginUrl = new URL('/login', req.url);
    const target = pathname === '/' ? '/' : pathname;
    loginUrl.searchParams.set('to', target);
    return NextResponse.redirect(loginUrl);
  }

  // Already authenticated and on the login page → home.
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all pathnames except `/api`, `/_next`, `/_vercel`, and files with a dot.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
