export interface ResponseEnvelopeMeta {
  requestId: string;
  timestamp: string;
  pagination?: PaginationMetadata;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SuccessEnvelope<T> {
  data: T;
  meta: ResponseEnvelopeMeta;
}

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[] | object;
  error?: string;
  errorCode?: string;
  i18nKey?: string;
  context?: Record<string, unknown>;
}

export interface ErrorEnvelope {
  data: null;
  error: ErrorResponse;
  meta: Omit<ResponseEnvelopeMeta, 'pagination'>;
}
