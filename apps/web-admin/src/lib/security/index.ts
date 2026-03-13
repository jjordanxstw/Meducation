/**
 * Security Utilities
 * Centralized security-related functions and constants
 */

export * from './cookies';
export * from './tokens';

/**
 * Log security events (for audit purposes)
 * In production, this should send to an audit logging service
 */
export function logSecurityEvent(event: string, details?: Record<string, unknown>): void {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[Security Audit]', logData);
  }

  // In production, send to audit logging service
  // Example: await auditService.logSecurityEvent(event, details);
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

/**
 * Content Security Policy configuration
 */
export const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  API: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;
