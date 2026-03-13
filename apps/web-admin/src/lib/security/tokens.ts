/**
 * Token Utilities
 * Centralized token management with security best practices
 */

import { getAuthCookie, hasAuthCookie, isTokenExpired } from './cookies';

const TOKEN_REFRESH_THRESHOLD = 5 * 60; // 5 minutes before expiration

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  if (!hasAuthCookie()) {
    return false;
  }

  const token = getAuthCookie();
  if (!token || isTokenExpired(token)) {
    return false;
  }

  return true;
}

/**
 * Get the current auth token
 */
export function getAuthToken(): string | null {
  const token = getAuthCookie();

  if (!token) return null;
  if (isTokenExpired(token)) return null;

  return token;
}

/**
 * Check if token should be refreshed
 */
export function shouldRefreshToken(): boolean {
  const token = getAuthToken();
  if (!token) return false;

  const payload = parseJWT(token);
  if (!payload?.exp) return false;

  const timeUntilExpiry = payload.exp - Math.floor(Date.now() / 1000);
  return timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD;
}

/**
 * Parse JWT token (without verification - for UI only)
 */
function parseJWT(token: string): { sub?: string; exp?: number; iat?: number } | null {
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
 * Sanitize error messages to prevent information leakage
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    // Remove stack traces and sensitive paths
    return error
      .replace(/at .+:\d+:\d+/g, '')
      .replace(/\/.+\/src\//g, '')
      .trim();
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}

/**
 * Generate CSRF token (placeholder - should be implemented with backend)
 */
export function generateCSRFToken(): string {
  // This should be replaced with actual CSRF token generation
  // using crypto API and validated on the backend
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
