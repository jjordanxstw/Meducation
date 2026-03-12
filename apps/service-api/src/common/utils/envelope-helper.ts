import {
  SuccessEnvelope,
  ErrorEnvelope,
  ResponseEnvelopeMeta,
  ErrorResponse,
} from '../dto/response-envelope.dto';
import { extractPaginationMeta } from './pagination-detector';

export function createSuccessEnvelope<T>(
  data: T,
  meta: ResponseEnvelopeMeta,
): SuccessEnvelope<T> {
  return {
    data,
    meta,
  };
}

export function createErrorEnvelope(
  error: ErrorResponse,
  meta: Omit<ResponseEnvelopeMeta, 'pagination'>,
): ErrorEnvelope {
  return {
    data: null,
    error,
    meta,
  };
}

export function createMeta(
  requestId: string,
  timestamp: string,
  data?: unknown,
): ResponseEnvelopeMeta {
  const pagination = data ? extractPaginationMeta(data) : undefined;

  return {
    requestId,
    timestamp,
    ...(pagination && { pagination }),
  };
}

export function createErrorMeta(
  requestId: string,
  timestamp: string,
): Omit<ResponseEnvelopeMeta, 'pagination'> {
  return {
    requestId,
    timestamp,
  };
}
