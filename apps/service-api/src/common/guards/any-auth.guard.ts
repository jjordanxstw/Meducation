/**
 * Hybrid Authentication Guard
 * Accepts both Google OAuth (students) and Admin JWT (admin users)
 *
 * Priority:
 * 1. Admin JWT Bearer token (Authorization: Bearer <admin_jwt>)
 * 2. Google OAuth token (Authorization: Bearer <google_id_token>)
 * 3. Session cookie (for students)
 */

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/v1/auth/services/auth.service';
import { AdminAuthService } from '../../modules/v1/admin-auth/services/admin-auth.service';

@Injectable()
export class AnyAuthGuard {
  constructor(
    private authService: AuthService,
    private adminAuthService: AdminAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Try Admin JWT first (Bearer token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Try admin authentication first
      const admin = await this.adminAuthService.verifyToken(token);
      if (admin) {
        request.admin = admin;
        request.user = null; // Clear user to avoid confusion
        return true;
      }

      // Try student authentication (Google OAuth)
      const user = await this.authService.getSessionFromHeader(token);
      if (user) {
        request.user = user;
        request.admin = null; // Clear admin to avoid confusion
        return true;
      }
    }

    // Fallback to admin access token cookie (httpOnly cookie flow)
    const adminAccessToken = request.cookies?.admin_access_token;
    if (adminAccessToken) {
      const admin = await this.adminAuthService.verifyToken(adminAccessToken);
      if (admin) {
        request.admin = admin;
        request.user = null;
        return true;
      }
    }

    // Fallback to session cookie (for students)
    const cookieName = process.env.SESSION_COOKIE_NAME || 'session';
    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader
        .split(';')
        .map((s: string) => s.trim())
        .find((s: string) => s.startsWith(`${cookieName}=`));
      if (match) {
        const sessionToken = match.substring(cookieName.length + 1);
        const user = await this.authService.getSessionFromCookie(sessionToken);
        if (user) {
          request.user = user;
          request.admin = null; // Clear admin to avoid confusion
          return true;
        }
      }
    }

    throw new UnauthorizedException('Missing or invalid authentication');
  }
}

/**
 * Optional Authentication Guard
 * Allows access without authentication, but attaches user/admin if valid
 */
@Injectable()
export class OptionalAnyAuthGuard extends AnyAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
      return true;
    } catch (error) {
      // Allow request to proceed without authentication
      const request = context.switchToHttp().getRequest();
      request.user = null;
      request.admin = null;
      return true;
    }
  }
}
