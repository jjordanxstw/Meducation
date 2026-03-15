import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class OptionalAuthGuard {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Try Authorization Bearer token first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.substring(7);
      const user = await this.authService.getSessionFromHeader(idToken);
      if (user) {
        request.user = user;
      }
      return true;
    }

    // Try session cookie
    const cookieName = process.env.SESSION_COOKIE_NAME || 'session';
    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.split(';').map((s: string) => s.trim()).find((s: string) => s.startsWith(`${cookieName}=`));
      if (match) {
        const sessionToken = match.substring(cookieName.length + 1);
        const user = await this.authService.getSessionFromCookie(sessionToken);
        if (user) {
          request.user = user;
        }
      }
    }

    // Always allow access, user may or may not be set
    return true;
  }
}
