import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Create the next-intl middleware
const intlMiddleware = createIntlMiddleware(routing);

// Public routes (without locale prefix for matching)
const publicRoutes = new Set(['/login', '/auth/sync']);

// Check if pathname matches a public route (accounting for locale prefix)
function isPublicRoute(pathname: string): boolean {
  // Check exact match
  if (publicRoutes.has(pathname)) {
    return true;
  }
  // Check with locale prefix (e.g., /en/login, /th/login)
  for (const locale of routing.locales) {
    if (publicRoutes.has(pathname.slice(locale.length + 1))) {
      return true;
    }
  }
  return false;
}

/**
 * Proxy function for Next.js 16+
 * Handles:
 * 1. i18n routing (locale detection and redirects)
 * 2. Authentication (session validation and route protection)
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

  // Step 1: Handle i18n routing first
  const intlResponse = intlMiddleware(req);
  if (intlResponse.status !== 200 || intlResponse.headers.get('x-middleware-rewrite')) {
    // If intl middleware wants to redirect or rewrite, let it
    return intlResponse;
  }

  // Step 2: Handle authentication
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isPublic = isPublicRoute(pathname);

  // Extract locale from pathname for redirects
  const localeMatch = pathname.match(/^\/(en|th)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;

  // If not authenticated and trying to access protected route
  if (!token && !isPublic) {
    const loginUrl = new URL(`/${locale}/login`, req.url);
    const target = pathname === `/${locale}` || pathname === '/' ? '/' : pathname;
    loginUrl.searchParams.set('to', target);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and on login page, redirect to home
  if (token && pathname.includes('/login')) {
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  return intlResponse;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/', '/(th|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
