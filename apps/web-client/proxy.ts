import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/register', '/forgot-password'];

/**
 * Proxy function for Next.js 16+
 * Uses cookie-based session validation without external fetch calls
 * This is the recommended pattern for authentication in Next.js 15+
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip proxy for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if the route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // For public routes, check if user has a valid session
    const sessionToken = req.cookies.get('session_token')?.value;

    // If authenticated and trying to access login page, redirect to dashboard
    if (sessionToken && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  }

  // For protected routes, check for session token
  const sessionToken = req.cookies.get('session_token')?.value;

  if (!sessionToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Basic token validation (check format)
  const parts = sessionToken.split('.');
  if (parts.length !== 3) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode JWT payload to check expiration
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
