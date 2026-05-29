import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes, timingSafeEqual } from 'crypto';
import { ErrorCode } from '@medical-portal/shared';

export const CSRF_COOKIE_NAME = '_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/** Cryptographically random double-submit token (32 bytes hex). */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/** Constant-time string comparison that tolerates length differences. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// State-changing endpoints that bootstrap a session and therefore cannot carry a
// CSRF header yet. They are still protected by other means (Google ID token /
// password + rate limiting) and they (re)issue the _csrf cookie on success.
const EXCLUDED_PATHS = new Set<string>([
  '/api/v1/auth/verify',
  '/api/v1/admin/auth/login',
  '/api/v1/admin/auth/refresh',
]);

/**
 * Double-submit cookie CSRF protection. On every state-changing request the
 * `x-csrf-token` header must match the non-httpOnly `_csrf` cookie. Safe methods
 * and the session-bootstrap endpoints are exempt.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(req.method)) {
      return next();
    }

    // req.path excludes the query string; compare against the prefixed routes.
    if (EXCLUDED_PATHS.has(req.path)) {
      return next();
    }

    const cookieToken = (req.cookies as Record<string, string | undefined> | undefined)?.[CSRF_COOKIE_NAME];
    const headerValue = req.headers[CSRF_HEADER_NAME];
    const headerToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
      this.reject(req, res);
      return;
    }

    next();
  }

  // Middleware-level exceptions bypass Nest's global filter, so emit the same
  // error envelope shape directly.
  private reject(req: Request, res: Response): void {
    const timestamp = new Date().toISOString();
    const requestId = (req as Request & { id?: string }).id ?? 'unknown';
    res.status(403).json({
      data: null,
      error: {
        statusCode: 403,
        timestamp,
        path: req.url,
        method: req.method,
        message: 'CSRF token missing or invalid',
        errorCode: ErrorCode.AUTHZ_FORBIDDEN,
      },
      meta: { requestId, timestamp },
    });
  }
}
