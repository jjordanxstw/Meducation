import axios from 'axios';

/**
 * A short, quotable code for a failed request ("REQ-7f3a2"), taken from the
 * API's request id so the team can find it in the logs.
 */
export function requestCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  const fromHeader = error.response?.headers?.['x-request-id'];
  const body = error.response?.data as { meta?: { requestId?: string } } | undefined;
  const id = (typeof fromHeader === 'string' ? fromHeader : undefined) ?? body?.meta?.requestId;
  return id ? `REQ-${id.replace(/-/g, '').slice(0, 5)}` : null;
}
