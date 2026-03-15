/**
 * Admin JWT Auth Guard
 * Validates JWT tokens for admin users
 * Separate from student JWT guard to prevent cross-access
 * Supports both Authorization header and httpOnly cookie
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { AdminAuthService } from '../services/admin-auth.service';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private adminAuthService: AdminAuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      let token: string | undefined;

      // First, try to get token from Authorization header (for backward compatibility)
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      // If no token in header, try to get from httpOnly cookie
      if (!token) {
        token = request.cookies?.admin_access_token;
      }

      if (!token) {
        throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, undefined, 'Missing or invalid authentication');
      }

      const admin = await this.adminAuthService.verifyToken(token);

      if (!admin) {
        throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, { tokenType: 'admin_access' }, 'Invalid or expired token');
      }

      // Attach admin to request
      request.admin = admin;
      return true;
    } catch (error) {
      throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, { tokenType: 'admin_access' }, 'Invalid or expired token');
    }
  }
}

/**
 * Optional Admin Auth Guard
 * Allows access without token, but attaches admin if valid token provided
 */
@Injectable()
export class OptionalAdminJwtAuthGuard extends AdminJwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
      return true;
    } catch (error) {
      // Allow request to proceed without authentication
      const request = context.switchToHttp().getRequest();
      request.admin = null;
      return true;
    }
  }
}
