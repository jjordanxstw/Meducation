/**
 * Shared API helpers for the admin client (6.2).
 *
 * CSRF: the backend uses double-submit cookies. Since the admin app is served
 * same-origin behind /api/v1, the non-httpOnly `_csrf` cookie is readable here
 * and echoed back as the `x-csrf-token` header on every state-changing request.
 */
import type { AxiosInstance } from 'axios';

const CSRF_SAFE_METHODS = new Set(['get', 'head', 'options']);

export function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Attach a request interceptor that injects the CSRF header on mutations. */
export function attachCsrfInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const method = (config.method ?? 'get').toLowerCase();
    if (!CSRF_SAFE_METHODS.has(method)) {
      const token = readCsrfToken();
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>)['x-csrf-token'] = token;
      }
    }
    return config;
  });
}
