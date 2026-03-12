import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorEnvelope } from '../dto/response-envelope.dto';

declare module 'express' {
  interface Request {
    id: string;
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Check if response has already been sent (e.g., redirect)
    if (response.headersSent) {
      this.logger.warn(
        `Response already sent for ${request.method} ${request.url}. Skipping error response.`,
      );
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    let message: string | string[] | object;
    let error: string | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const responseObj = exceptionResponse as Record<string, unknown>;
      message = (responseObj.message as string | string[] | object) || exceptionResponse;
      error = responseObj.error as string | undefined;
    } else {
      message = 'Internal server error';
    }

    const timestamp = new Date().toISOString();
    const requestId = (request as Request).id || 'unknown';

    const errorResponse: ErrorEnvelope = {
      data: null,
      error: {
        statusCode: status,
        timestamp,
        path: request.url,
        method: request.method,
        message,
        error,
      },
      meta: {
        requestId,
        timestamp,
      },
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} [${requestId}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} ${status} [${requestId}] - ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
