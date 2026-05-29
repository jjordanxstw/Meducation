import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { ErrorCode } from '@medical-portal/shared';
import { AppException } from '../errors';
import { SKIP_TIMEOUT_KEY } from '../decorators/skip-timeout.decorator';

/**
 * Applies a hard 30s timeout to every request so a slow Supabase query cannot
 * hold a connection indefinitely. Returns 503 (REQUEST_TIMEOUT) on expiry.
 * Handlers/controllers decorated with @SkipTimeout() are exempt (e.g. uploads).
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutMs = 30_000;

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TIMEOUT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return next.handle();
    }

    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new AppException(
                ErrorCode.REQUEST_TIMEOUT,
                undefined,
                'The request took too long to process',
              ),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
