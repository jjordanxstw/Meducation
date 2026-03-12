import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private authService: AuthService) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const cookieName = process.env.SESSION_COOKIE_NAME || 'session';
    const cookieHeader = request.headers.cookie;

    // Try session cookie first
    if (cookieHeader) {
      const match = cookieHeader.split(';').map((s: string) => s.trim()).find((s: string) => s.startsWith(`${cookieName}=`));
      if (match) {
        const sessionToken = match.substring(cookieName.length + 1);
        return this.authService.getSessionFromCookie(sessionToken).then(user => {
          if (user) {
            request.user = user;
            return true;
          }
          throw new UnauthorizedException('Invalid or expired session');
        });
      }
    }

    // Fallback to standard JWT guard
    return super.canActivate(context) as boolean | Promise<boolean> | Observable<boolean>;
  }
}
