/**
 * Server-side authentication utilities
 * Uses cookies to validate authentication without external fetch calls
 */

import { cookies } from 'next/headers';

export interface Session {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    profile?: any;
  };
}

const publicRoutes = ['/login', '/register', '/forgot-password'];

/**
 * Check if the current path is a public route
 */
export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route));
}

/**
 * Get session from cookies without external fetch
 * This is more efficient than making API calls in middleware
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return null;
    }

    // Decode JWT token (basic validation)
    // In production, you might want to verify the signature
    const parts = sessionToken.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return {
      isAuthenticated: true,
      user: {
        id: payload.sub || payload.userId,
        email: payload.email,
        role: payload.role,
        profile: payload.profile,
      },
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session?.isAuthenticated || false;
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}
