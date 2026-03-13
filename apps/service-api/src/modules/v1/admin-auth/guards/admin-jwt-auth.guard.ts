/**
 * Admin JWT Auth Guard
 * Validates JWT tokens for admin users
 * Separate from student JWT guard to prevent cross-access
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { AdminAuthService } from '../services/admin-auth.service';

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private adminAuthService: AdminAuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or invalid authorization header');
      }

      const token = authHeader.substring(7);
      const admin = await this.adminAuthService.verifyToken(token);

      if (!admin) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Attach admin to request
      request.admin = admin;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
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
