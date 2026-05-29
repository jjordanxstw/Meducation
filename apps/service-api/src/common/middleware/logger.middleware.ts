import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { id?: string };
}

/**
 * Logs a single structured line on every request completion. Runs after the
 * request-id middleware (so `req.id` is set) and after auth guards have
 * populated `req.user`, since it logs on the response `finish` event.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const route = req.route?.path ?? req.path;

      this.logger.log({
        msg: 'request_completed',
        requestId: req.id ?? 'unknown',
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration_ms: durationMs,
        userId: req.user?.id ?? null,
        action: `${req.method} ${route}`,
        environment: process.env.NODE_ENV ?? 'development',
      });
    });

    next();
  }
}
