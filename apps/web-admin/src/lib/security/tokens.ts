/**
 * Token Utilities
 * Shared security helpers
 *
 * Note: Do not derive authentication state from client-readable cookies.
 * Admin auth uses backend-managed httpOnly cookies.
 */

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
