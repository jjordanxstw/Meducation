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

    // First, try to get token from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return this.validateToken(request, token);
    }

    // Try to get token from httpOnly cookie (student_access_token)
    const accessToken = request.cookies?.student_access_token;
    if (accessToken) {
      return this.validateToken(request, accessToken);
    }

    // Fallback to old session cookie for backward compatibility
    const cookieName = process.env.SESSION_COOKIE_NAME || 'session';
    const cookieHeader = request.headers.cookie;
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

    throw new UnauthorizedException('Missing or invalid authentication');
  }

  private async validateToken(request: any, token: string): Promise<boolean> {
    try {
      const payload = await this.authService.verifySessionToken(token);
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Get user from session
      const user = await this.authService.getSessionFromCookie(token);
      if (!user) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
