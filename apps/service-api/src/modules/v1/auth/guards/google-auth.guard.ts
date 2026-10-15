import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class GoogleAuthGuard {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // First, try to get token from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.substring(7);
      const user = await this.authService.getSessionFromHeader(idToken);
      if (user) {
        request.user = user;
        return true;
      }
    }

    // Try to get token from httpOnly cookie (student_access_token)
    const accessToken = request.cookies?.student_access_token;
    if (accessToken) {
      const payload = await this.authService.verifySessionToken(accessToken);
      if (payload && payload.sub) {
        const user = await this.authService.getSessionFromCookie(accessToken);
        if (user) {
          request.user = user;
          return true;
        }
      }
    }

    throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, undefined, 'Missing or invalid authentication');
  }
}
