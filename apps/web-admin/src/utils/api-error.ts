import axios from 'axios';

type ApiErrorDetail = {
  errorCode?: string;
  message?: string | string[] | Record<string, unknown>;
};

type ApiErrorEnvelope = {
  error?: ApiErrorDetail;
  message?: string | string[];
};

/** Human-readable English messages keyed by the API's stable error codes. */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'Invalid username or password',
  AUTH_ACCOUNT_INACTIVE: 'Account is inactive',
  AUTH_TOKEN_INVALID: 'Invalid session, please log in again',
  AUTH_TOKEN_EXPIRED: 'Session expired, please log in again',
  AUTH_TOKEN_REVOKED: 'Session revoked, please log in again',
  AUTH_REFRESH_TOKEN_MISSING: 'Refresh token not found',
  AUTHZ_FORBIDDEN: 'You do not have permission to perform this action',
  AUTHZ_ADMIN_REQUIRED: 'Administrator privileges are required',
  VALIDATION_FAILED: 'Validation failed',
  VALIDATION_INVALID_INPUT: 'Invalid input',
  RESOURCE_NOT_FOUND: 'Requested resource was not found',
  RESOURCE_CONFLICT: 'Resource conflict',
  RESOURCE_OPERATION_FAILED: 'Resource operation failed',
  SUBJECT_CODE_DUPLICATE: 'Subject code already exists',
  SUBJECT_NAME_DUPLICATE: 'Subject name already exists',
  SECTION_NAME_DUPLICATE: 'Section name already exists in this subject',
  LECTURE_TITLE_DUPLICATE: 'Lecture title already exists in this section',
  RESOURCE_LABEL_DUPLICATE: 'Resource label already exists in this lecture',
  RESOURCE_URL_DUPLICATE: 'Resource URL already exists in this lecture',
  RESOURCE_URL_INVALID: 'Resource URL is invalid',
  PROFILE_EMAIL_DUPLICATE: 'Email already exists',
  PROFILE_STUDENT_ID_DUPLICATE: 'Student ID already exists',
  CALENDAR_TIME_RANGE_INVALID: 'Calendar event date range is invalid',
  CALENDAR_EVENT_TIME_CONFLICT: 'Calendar event date conflicts with an existing event',
  CALENDAR_EVENT_TYPE_IN_USE: 'There are events on this type. Please delete all events of this type first.',
  CALENDAR_EVENT_TYPE_NAME_DUPLICATE: 'An event type with this name already exists',
  SYSTEM_INTERNAL_ERROR: 'Internal server error',
  SYSTEM_EXTERNAL_SERVICE_ERROR: 'External service error',
};

const FALLBACK_MESSAGE_BY_STATUS: Record<number, string> = {
  400: 'Validation failed',
  401: 'Invalid session, please log in again',
  403: 'You do not have permission to perform this action',
  404: 'Requested resource was not found',
  409: 'Resource conflict',
  500: 'Internal server error',
  502: 'External service error',
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

export function resolveApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!axios.isAxiosError<ApiErrorEnvelope>(error)) {
    return fallback;
  }

  const status = error.response?.status;
  const payload = error.response?.data;
  const detail = payload?.error;

  const errorCode = detail?.errorCode;
  if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
    return ERROR_CODE_MESSAGES[errorCode];
  }

  const payloadMessage = normalizeMessage(detail?.message) ?? normalizeMessage(payload?.message);
  if (payloadMessage) {
    return payloadMessage;
  }

  if (status && FALLBACK_MESSAGE_BY_STATUS[status]) {
    return FALLBACK_MESSAGE_BY_STATUS[status];
  }

  return fallback;
}
