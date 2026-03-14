import { HttpException } from '@nestjs/common';
import {
  ErrorCode,
  ERROR_DEFINITIONS,
} from '@medical-portal/shared';

export class AppException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly i18nKey: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    errorCode: ErrorCode,
    context?: Record<string, unknown>,
    overrideMessage?: string,
  ) {
    const definition = ERROR_DEFINITIONS[errorCode];
    const message = overrideMessage ?? definition.defaultMessage;

    super(
      {
        message,
        errorCode,
        i18nKey: definition.i18nKey,
        context,
      },
      definition.httpStatus,
    );

    this.errorCode = errorCode;
    this.i18nKey = definition.i18nKey;
    this.context = context;
  }
}
