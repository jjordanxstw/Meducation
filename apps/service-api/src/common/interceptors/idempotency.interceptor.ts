import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ErrorCode } from '@medical-portal/shared';
import { AppException } from '../errors';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Idempotency for mutating endpoints. When an `Idempotency-Key` (UUID) header is
 * present, the first response is cached (idempotency_cache, 24h TTL) and replayed
 * for subsequent identical requests with `Idempotency-Replayed: true`. Reusing a
 * key with a different request body is rejected with 409.
 *
 * No header => behaves as a normal request (idempotency is opt-in per call).
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private readonly client: SupabaseClient | null;

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.client =
      url && key
        ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
        : null;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const headerValue = req.headers['idempotency-key'];
    const key = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!key || !this.client) {
      return next.handle();
    }

    if (!UUID_REGEX.test(key)) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: 'Idempotency-Key' },
        'Idempotency-Key must be a valid UUID',
      );
    }

    const requestHash = createHash('sha256')
      .update(`${req.method}:${req.originalUrl}:${JSON.stringify(req.body ?? {})}`)
      .digest('hex');

    const { data: existing } = await this.client
      .from('idempotency_cache')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (existing && new Date(existing.expires_at) > new Date()) {
      if (existing.request_hash !== requestHash) {
        throw new AppException(
          ErrorCode.RESOURCE_CONFLICT,
          { field: 'Idempotency-Key' },
          'Idempotency-Key was already used with a different request',
        );
      }
      res.setHeader('Idempotency-Replayed', 'true');
      res.status(200);
      return of(existing.response_body);
    }

    return next.handle().pipe(
      tap((body) => {
        const responseStatus = res.statusCode;
        void this.client!
          .from('idempotency_cache')
          .upsert(
            {
              key,
              request_hash: requestHash,
              response_status: responseStatus,
              response_body: body ?? null,
            },
            { onConflict: 'key' },
          )
          .then(({ error }) => {
            if (error) {
              this.logger.warn(`Failed to persist idempotency record (code=${error.code ?? 'unknown'})`);
            }
          });
      }),
    );
  }
}
