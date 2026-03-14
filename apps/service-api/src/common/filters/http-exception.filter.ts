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
import { AppException } from '../errors';
import { ErrorCode } from '@medical-portal/shared';

declare module 'express' {
  interface Request {
    id: string;
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  private mapStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTH_TOKEN_INVALID;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.AUTHZ_FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.RESOURCE_CONFLICT;
      default:
        return ErrorCode.SYSTEM_INTERNAL_ERROR;
    }
  }

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
    let errorCode: string | undefined;
    let i18nKey: string | undefined;
    let context: Record<string, unknown> | undefined;

    if (exception instanceof AppException) {
      errorCode = exception.errorCode;
      i18nKey = exception.i18nKey;
      context = exception.context;
    }

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const responseObj = exceptionResponse as Record<string, unknown>;
      message = (responseObj.message as string | string[] | object) || exceptionResponse;
      error = responseObj.error as string | undefined;

      if (!errorCode && typeof responseObj.errorCode === 'string') {
        errorCode = responseObj.errorCode;
      }
      if (!i18nKey && typeof responseObj.i18nKey === 'string') {
        i18nKey = responseObj.i18nKey;
      }
      if (!context && typeof responseObj.context === 'object' && responseObj.context !== null) {
        context = responseObj.context as Record<string, unknown>;
      }
    } else {
      message = 'Internal server error';
    }

    if (!errorCode) {
      errorCode = this.mapStatusToErrorCode(status);
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
        errorCode,
        i18nKey,
        ...(context ? { context } : {}),
      },
      meta: {
        requestId,
        timestamp,
      },
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} [${requestId}] [${errorCode}]`,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} ${status} [${requestId}] [${errorCode}]`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
