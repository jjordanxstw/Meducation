/**
 * Cookie Management Utilities
 * Secure cookie operations for authentication tokens
 */

const TOKEN_COOKIE_NAME = 'admin_access_token';

// Reserved for future refresh token implementation
// const REFRESH_TOKEN_COOKIE_NAME = 'admin_refresh_token';

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Default secure cookie options for production
 */
export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 60 * 60, // 1 hour
};

/**
 * Set authentication cookie with security options
 */
export function setAuthCookie(token: string, options?: Partial<CookieOptions>): void {
  if (typeof document === 'undefined') return;

  const opts = { ...DEFAULT_COOKIE_OPTIONS, ...options };
  const cookieParts = [
    `${TOKEN_COOKIE_NAME}=${token}`,
    `path=${opts.path}`,
    opts.maxAge !== undefined ? `max-age=${opts.maxAge}` : '',
    opts.secure ? 'secure' : '',
    opts.httpOnly ? 'httponly' : '',
    opts.sameSite ? `samesite=${opts.sameSite}` : '',
  ].filter(Boolean).join('; ');

  document.cookie = cookieParts;
}

/**
 * Get authentication token from cookies (for non-httpOnly access)
 * Note: This only works for non-httpOnly cookies
 * For httpOnly cookies, the browser handles them automatically
 */
export function getAuthCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => {
    const [name] = cookie.trim().split('=');
    return name === TOKEN_COOKIE_NAME;
  });

  return tokenCookie?.split('=')[1];
}

/**
 * Remove authentication cookie
 */
export function removeAuthCookie(): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; max-age=0; SameSite=lax${process.env.NODE_ENV === 'production' ? '; secure' : ''}`;
}

/**
 * Check if auth cookie exists
 */
export function hasAuthCookie(): boolean {
  return getAuthCookie() !== undefined;
}

/**
 * Parse JWT token (without verification - for UI only)
 */
export function parseJWT(token: string): { sub?: string; exp?: number; iat?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired (client-side check only)
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload?.exp) return true;

  return payload.exp * 1000 < Date.now();
}

/**
 * Get token expiration time in seconds
 */
export function getTokenExpirationTime(token: string): number | null {
  const payload = parseJWT(token);
  return payload?.exp ? payload.exp - Math.floor(Date.now() / 1000) : null;
}
