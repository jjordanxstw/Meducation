/**
 * Middleware for Route Protection & Security
 *
 * Features:
 * - Route protection based on authentication status
 * - Security headers injection
 * - CSRF protection hints
 * - Rate limiting hints
 */

import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { publicRoutes, protectedRoutes } from '@/lib/auth/routes';

// Cookie name (must match backend)
const TOKEN_COOKIE_NAME = 'admin_access_token';

// Rate limiting state (in-memory - use Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 100; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

/**
 * Simple rate limiter (for demonstration - use proper rate limiting in production)
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (basic version)
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

/**
 * Check if token is expired (JWT validation)
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString()
    );

    if (!payload.exp) return true;

    return payload.exp < Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

/**
 * Middleware main function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Get client IP from headers (Next.js doesn't expose request.ip directly)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Rate limiting
  if (!checkRateLimit(ip)) {
    return addSecurityHeaders(
      new NextResponse('Too Many Requests', { status: 429 })
    );
  }

  const response = NextResponse.next();

  // Add security headers to all responses
  addSecurityHeaders(response);

  // Get the admin access token cookie
  const adminToken = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  // Root path handling
  if (pathname === '/') {
    // If already authenticated with valid token, redirect to dashboard
    if (adminToken && !isTokenExpired(adminToken)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise show login page
    return response;
  }

  // Check public routes (login, forgot-password, etc.)
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublicRoute) {
    // If authenticated user tries to access login, redirect to dashboard
    if (adminToken && !isTokenExpired(adminToken) && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return response;
  }

  // Check protected routes
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtectedRoute) {
    // Verify authentication
    if (!adminToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Check if token is expired
    if (isTokenExpired(adminToken)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      // Clear expired cookie by setting it with max-age=0
      response.cookies.set(TOKEN_COOKIE_NAME, '', {
        maxAge: 0,
        path: '/',
      });
      return NextResponse.redirect(url);
    }

    // Token is valid - allow access
    // Additional server-side validation will happen via API calls
    return response;
  }

  // Allow all other routes (static files, etc.)
  return response;
}

/**
 * Middleware matcher configuration
 */
export const config = {
  matcher: [
    // Match all routes except:
    // - API routes (handled by backend)
    // - Static files (_next/static)
    // - Images (_next/image)
    // - Favicon and other static assets
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};
