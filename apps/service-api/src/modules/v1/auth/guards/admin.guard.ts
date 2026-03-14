import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_KEY } from '../../../../common';
import type { UserWithoutPassword } from '../entities/profile.entity';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route has @Admin() decorator
    const isAdminRoute = this.reflector.getAllAndOverride<boolean>(ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isAdminRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: UserWithoutPassword = request.user;

    if (!user?.profile || user.profile.role !== 'admin') {
      throw new AppException(ErrorCode.AUTHZ_ADMIN_REQUIRED);
    }

    return true;
  }
}
