import { ErrorCode } from './error-codes';

export type ErrorCategory = 'AUTH' | 'AUTHZ' | 'VALIDATION' | 'RESOURCE' | 'SYSTEM';

export interface ErrorDefinition {
  code: ErrorCode;
  i18nKey: string;
  defaultMessage: string;
  category: ErrorCategory;
  httpStatus: number;
}

export const ERROR_DEFINITIONS: Record<ErrorCode, ErrorDefinition> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
    code: ErrorCode.AUTH_INVALID_CREDENTIALS,
    i18nKey: 'errors.auth.invalidCredentials',
    defaultMessage: 'Invalid username or password',
    category: 'AUTH',
    httpStatus: 401,
  },
  [ErrorCode.AUTH_ACCOUNT_INACTIVE]: {
    code: ErrorCode.AUTH_ACCOUNT_INACTIVE,
    i18nKey: 'errors.auth.accountInactive',
    defaultMessage: 'Account is inactive',
    category: 'AUTH',
    httpStatus: 401,
  },
  [ErrorCode.AUTH_TOKEN_INVALID]: {
    code: ErrorCode.AUTH_TOKEN_INVALID,
    i18nKey: 'errors.auth.tokenInvalid',
    defaultMessage: 'Invalid authentication token',
    category: 'AUTH',
    httpStatus: 401,
  },
  [ErrorCode.AUTH_TOKEN_EXPIRED]: {
    code: ErrorCode.AUTH_TOKEN_EXPIRED,
    i18nKey: 'errors.auth.tokenExpired',
    defaultMessage: 'Authentication token has expired',
    category: 'AUTH',
    httpStatus: 401,
  },
  [ErrorCode.AUTH_TOKEN_REVOKED]: {
    code: ErrorCode.AUTH_TOKEN_REVOKED,
    i18nKey: 'errors.auth.tokenRevoked',
    defaultMessage: 'Authentication token has been revoked',
    category: 'AUTH',
    httpStatus: 401,
  },
  [ErrorCode.AUTH_REFRESH_TOKEN_MISSING]: {
    code: ErrorCode.AUTH_REFRESH_TOKEN_MISSING,
    i18nKey: 'errors.auth.refreshTokenMissing',
    defaultMessage: 'Refresh token not found',
    category: 'AUTH',
    httpStatus: 401,
  },
  [ErrorCode.AUTHZ_FORBIDDEN]: {
    code: ErrorCode.AUTHZ_FORBIDDEN,
    i18nKey: 'errors.authorization.forbidden',
    defaultMessage: 'You do not have permission to perform this action',
    category: 'AUTHZ',
    httpStatus: 403,
  },
  [ErrorCode.AUTHZ_ADMIN_REQUIRED]: {
    code: ErrorCode.AUTHZ_ADMIN_REQUIRED,
    i18nKey: 'errors.authorization.adminRequired',
    defaultMessage: 'This action requires administrator privileges',
    category: 'AUTHZ',
    httpStatus: 403,
  },
  [ErrorCode.VALIDATION_FAILED]: {
    code: ErrorCode.VALIDATION_FAILED,
    i18nKey: 'errors.validation.failed',
    defaultMessage: 'Validation failed',
    category: 'VALIDATION',
    httpStatus: 400,
  },
  [ErrorCode.VALIDATION_INVALID_INPUT]: {
    code: ErrorCode.VALIDATION_INVALID_INPUT,
    i18nKey: 'errors.validation.invalidInput',
    defaultMessage: 'Invalid input',
    category: 'VALIDATION',
    httpStatus: 400,
  },
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    code: ErrorCode.RESOURCE_NOT_FOUND,
    i18nKey: 'errors.resource.notFound',
    defaultMessage: 'Resource not found',
    category: 'RESOURCE',
    httpStatus: 404,
  },
  [ErrorCode.RESOURCE_CONFLICT]: {
    code: ErrorCode.RESOURCE_CONFLICT,
    i18nKey: 'errors.resource.conflict',
    defaultMessage: 'Resource conflict',
    category: 'RESOURCE',
    httpStatus: 409,
  },
  [ErrorCode.RESOURCE_OPERATION_FAILED]: {
    code: ErrorCode.RESOURCE_OPERATION_FAILED,
    i18nKey: 'errors.resource.operationFailed',
    defaultMessage: 'Resource operation failed',
    category: 'RESOURCE',
    httpStatus: 400,
  },
  [ErrorCode.SUBJECT_CODE_DUPLICATE]: {
    code: ErrorCode.SUBJECT_CODE_DUPLICATE,
    i18nKey: 'errors.subject.codeDuplicate',
    defaultMessage: 'Subject code already exists',
    category: 'RESOURCE',
    httpStatus: 409,
  },
  [ErrorCode.SUBJECT_NAME_DUPLICATE]: {
    code: ErrorCode.SUBJECT_NAME_DUPLICATE,
    i18nKey: 'errors.subject.nameDuplicate',
    defaultMessage: 'Subject name already exists',
    category: 'RESOURCE',
    httpStatus: 409,
  },
  [ErrorCode.SYSTEM_INTERNAL_ERROR]: {
    code: ErrorCode.SYSTEM_INTERNAL_ERROR,
    i18nKey: 'errors.system.internalError',
    defaultMessage: 'Internal server error',
    category: 'SYSTEM',
    httpStatus: 500,
  },
  [ErrorCode.SYSTEM_EXTERNAL_SERVICE_ERROR]: {
    code: ErrorCode.SYSTEM_EXTERNAL_SERVICE_ERROR,
    i18nKey: 'errors.system.externalServiceError',
    defaultMessage: 'External service error',
    category: 'SYSTEM',
    httpStatus: 502,
  },
};
