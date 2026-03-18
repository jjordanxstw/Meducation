function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item)).join(',');
  }

  return String(value);
}

export function buildRequestCacheKey(
  scope: string,
  query: Record<string, unknown> | undefined,
): string {
  const normalized = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, normalizeValue(value)] as const)
    .sort((left, right) => left[0].localeCompare(right[0]));

  if (normalized.length === 0) {
    return scope;
  }

  const queryString = normalized
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return `${scope}?${queryString}`;
}
