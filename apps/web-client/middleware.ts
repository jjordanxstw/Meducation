import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    // Check if user is already authenticated
    const session = await getSession(req);
    if (session?.isAuthenticated) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const session = await getSession(req);

  if (!session?.isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

async function getSession(req: NextRequest) {
  try {
    // Middleware runs server-side, so we need the actual backend URL
    // NEXT_PUBLIC_API_URL may be empty in development (using rewrites)
    // so we need to use the actual backend URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      isAuthenticated: data.success,
      user: data.data?.user,
      profile: data.data?.user?.profile,
    };
  } catch {
    return null;
  }
}
