import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SKIP_ENVELOPE_KEY } from '../decorators/skip-envelope.decorator';
import {
  SuccessEnvelope,
  ResponseEnvelopeMeta,
} from '../dto/response-envelope.dto';
import { createMeta } from '../utils/envelope-helper';

declare module 'express' {
  interface Request {
    id: string;
  }
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skipEnvelope = this.reflector.getAllAndOverride<boolean>(
      SKIP_ENVELOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipEnvelope) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        const httpStatus = response.statusCode;

        if (httpStatus === HttpStatus.NO_CONTENT) {
          response.status(HttpStatus.OK);
          return this.createEmptyEnvelope(request.id);
        }

        return this.createSuccessEnvelope(request.id, data);
      }),
    );
  }

  private createSuccessEnvelope(
    requestId: string,
    data: unknown,
  ): SuccessEnvelope<unknown> {
    const timestamp = new Date().toISOString();
    const meta: ResponseEnvelopeMeta = createMeta(requestId, timestamp, data);

    return {
      data,
      meta,
    };
  }

  private createEmptyEnvelope(
    requestId: string,
  ): SuccessEnvelope<null> {
    const timestamp = new Date().toISOString();
    const meta: ResponseEnvelopeMeta = {
      requestId,
      timestamp,
    };

    return {
      data: null,
      meta,
    };
  }
}
