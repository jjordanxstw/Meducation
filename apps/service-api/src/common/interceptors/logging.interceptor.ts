import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

declare module 'express' {
  interface Request {
    id: string;
  }
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const requestId = request.id || 'unknown';

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = ctx.getResponse<Response>();
        const { statusCode } = response;
        const duration = Date.now() - now;

        this.logger.log(
          `${method} ${url} ${statusCode} [${requestId}] - ${userAgent} ${ip} +${duration}ms`,
        );
      }),
    );
  }
}
