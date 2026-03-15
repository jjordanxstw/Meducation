import { PaginationMetadata } from '../dto/response-envelope.dto';

const PAGINATION_KEYS = ['total', 'page', 'limit'] as const;

export function isPaginatedResponse(response: unknown): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const obj = response as Record<string, unknown>;

  for (const key of PAGINATION_KEYS) {
    if (!(key in obj) || typeof obj[key] !== 'number') {
      return false;
    }
  }

  const hasItemsArray = Object.keys(obj).some((key) => {
    const value = obj[key];
    return Array.isArray(value) && value.length >= 0;
  });

  return hasItemsArray;
}

export function extractPaginationMeta(
  response: unknown,
): PaginationMetadata | undefined {
  if (!isPaginatedResponse(response)) {
    return undefined;
  }

  const obj = response as Record<string, unknown>;
  const total = obj.total as number;
  const page = obj.page as number;
  const limit = obj.limit as number;

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrevious,
  };
}
