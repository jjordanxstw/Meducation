import axios from 'axios';
import { i18nProvider } from '../providers/i18n-provider';

type ApiErrorDetail = {
  errorCode?: string;
  i18nKey?: string;
  message?: string | string[] | Record<string, unknown>;
};

type ApiErrorEnvelope = {
  error?: ApiErrorDetail;
  message?: string | string[];
};

const ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'errors.auth.invalidCredentials',
  AUTH_ACCOUNT_INACTIVE: 'errors.auth.accountInactive',
  AUTH_TOKEN_INVALID: 'errors.auth.tokenInvalid',
  AUTH_TOKEN_EXPIRED: 'errors.auth.tokenExpired',
  AUTH_TOKEN_REVOKED: 'errors.auth.tokenRevoked',
  AUTH_REFRESH_TOKEN_MISSING: 'errors.auth.refreshTokenMissing',
  AUTHZ_FORBIDDEN: 'errors.authorization.forbidden',
  AUTHZ_ADMIN_REQUIRED: 'errors.authorization.adminRequired',
  VALIDATION_FAILED: 'errors.validation.failed',
  VALIDATION_INVALID_INPUT: 'errors.validation.invalidInput',
  RESOURCE_NOT_FOUND: 'errors.resource.notFound',
  RESOURCE_CONFLICT: 'errors.resource.conflict',
  RESOURCE_OPERATION_FAILED: 'errors.resource.operationFailed',
  SUBJECT_CODE_DUPLICATE: 'errors.subject.codeDuplicate',
  SUBJECT_NAME_DUPLICATE: 'errors.subject.nameDuplicate',
  SYSTEM_INTERNAL_ERROR: 'errors.system.internalError',
  SYSTEM_EXTERNAL_SERVICE_ERROR: 'errors.system.externalServiceError',
};

const FALLBACK_I18N_KEY_BY_STATUS: Record<number, string> = {
  400: 'errors.validation.failed',
  401: 'errors.auth.tokenInvalid',
  403: 'errors.authorization.forbidden',
  404: 'errors.resource.notFound',
  409: 'errors.resource.conflict',
  500: 'errors.system.internalError',
  502: 'errors.system.externalServiceError',
};

function normalizeMessage(message: unknown): string | undefined {
  if (typeof message === 'string') {
    return message;
  }
  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === 'string').join(', ');
  }
  return undefined;
}

export function resolveApiErrorMessage(error: unknown, fallback = 'errors.common.unexpected'): string {
  const fallbackMessage = i18nProvider.translate(fallback, {}, 'Something went wrong');

  if (!axios.isAxiosError<ApiErrorEnvelope>(error)) {
    return fallbackMessage;
  }

  const status = error.response?.status;
  const payload = error.response?.data;
  const detail = payload?.error;

  const i18nKeyFromPayload = detail?.i18nKey;
  if (i18nKeyFromPayload) {
    return i18nProvider.translate(i18nKeyFromPayload, {}, i18nKeyFromPayload);
  }

  const errorCode = detail?.errorCode;
  if (errorCode && ERROR_CODE_TO_I18N_KEY[errorCode]) {
    const key = ERROR_CODE_TO_I18N_KEY[errorCode];
    return i18nProvider.translate(key, {}, key);
  }

  const payloadMessage = normalizeMessage(detail?.message) ?? normalizeMessage(payload?.message);
  if (payloadMessage) {
    return payloadMessage;
  }

  if (status && FALLBACK_I18N_KEY_BY_STATUS[status]) {
    const key = FALLBACK_I18N_KEY_BY_STATUS[status];
    return i18nProvider.translate(key, {}, key);
  }

  return fallbackMessage;
}
