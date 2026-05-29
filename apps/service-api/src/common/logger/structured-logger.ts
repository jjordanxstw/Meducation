import { ConsoleLogger } from '@nestjs/common';

/**
 * Application logger that emits structured JSON in production and falls back to
 * Nest's human-friendly pretty output in development.
 *
 * Every JSON line carries `environment` and (when supplied by the caller) the
 * request-scoped fields required by the logging contract: requestId, userId,
 * action and duration_ms. Callers add those by passing an object as the log
 * message, e.g. `logger.log({ msg: 'request_completed', requestId, ... })`.
 */
export class StructuredLogger extends ConsoleLogger {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  log(message: unknown, ...rest: unknown[]): void {
    if (this.isProduction) return this.emit('info', message, rest);
    super.log(message as never, ...(rest as never[]));
  }

  error(message: unknown, ...rest: unknown[]): void {
    if (this.isProduction) return this.emit('error', message, rest);
    super.error(message as never, ...(rest as never[]));
  }

  warn(message: unknown, ...rest: unknown[]): void {
    if (this.isProduction) return this.emit('warn', message, rest);
    super.warn(message as never, ...(rest as never[]));
  }

  debug(message: unknown, ...rest: unknown[]): void {
    if (this.isProduction) return this.emit('debug', message, rest);
    super.debug(message as never, ...(rest as never[]));
  }

  verbose(message: unknown, ...rest: unknown[]): void {
    if (this.isProduction) return this.emit('verbose', message, rest);
    super.verbose(message as never, ...(rest as never[]));
  }

  private emit(level: string, message: unknown, rest: unknown[]): void {
    // Nest passes the logging context (and, for errors, a stack trace) as the
    // trailing string arguments. Peel those off so they become first-class
    // fields rather than noise in `details`.
    let context = this.context;
    let extras = rest;
    if (extras.length && typeof extras[extras.length - 1] === 'string') {
      context = extras[extras.length - 1] as string;
      extras = extras.slice(0, -1);
    }

    const entry: Record<string, unknown> = {
      level,
      time: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
      context: context ?? undefined,
    };

    if (message !== null && typeof message === 'object') {
      Object.assign(entry, message as Record<string, unknown>);
    } else {
      entry.message = message;
    }

    if (extras.length === 1 && typeof extras[0] === 'string') {
      entry.stack = extras[0];
    } else if (extras.length) {
      entry.details = extras;
    }

    process.stdout.write(`${JSON.stringify(entry)}\n`);
  }
}
