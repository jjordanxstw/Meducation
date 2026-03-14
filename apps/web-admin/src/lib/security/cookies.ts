/**
 * Cookie Utilities
 *
 * Important:
 * - Admin auth cookies are httpOnly and controlled by the backend.
 * - Client-side code cannot reliably set/clear/read those cookies.
 * - Keep these helpers read-only and diagnostic only.
 */

const TOKEN_COOKIE_NAME = 'admin_access_token';

/**
 * Get auth cookie value when available to JS.
 *
 * For backend-issued httpOnly cookies this will return undefined,
 * which is expected and should not be used for auth decisions.
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
