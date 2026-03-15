import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicRoutes = new Set(['/login', '/auth/sync']);

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.has(pathname);
}

/**
 * Proxy function for Next.js 16+
 * Uses cookie-based session validation without external fetch calls
 * This is the recommended pattern for authentication in Next.js 15+
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Skip proxy for API routes, static files, and Next.js internals
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

  if (!token && !isPublic) {
    const loginUrl = new URL('/login', req.url);
    const target = pathname === '/' ? '/' : `${pathname}${search}`;
    loginUrl.searchParams.set('to', target);
    return NextResponse.redirect(loginUrl);
  }

  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
