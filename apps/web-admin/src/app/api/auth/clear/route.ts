import { NextResponse } from 'next/server';

const ACCESS_COOKIE_NAME = 'admin_access_token';
const REFRESH_COOKIE_NAME = 'admin_refresh_token';

/**
 * Clear auth cookies server-side and redirect to the login root.
 * This avoids relying on client-side cookie deletion, which cannot remove httpOnly cookies.
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/';

  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction ? 'strict' : 'lax';

  response.cookies.set(ACCESS_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: '/',
    maxAge: 0,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: '/',
    maxAge: 0,
  });

  return response;
}
