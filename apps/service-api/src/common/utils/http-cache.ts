import { Response } from 'express';

/**
 * Server-side TTL for the curriculum read path (subjects → resources). Every
 * admin write drops these entries immediately, so the TTL only bounds how long
 * a cold entry lives; the browser keeps its own short `max-age` (P3).
 */
export const CONTENT_SERVER_CACHE_TTL_SECONDS = 300;

interface CacheHeaderOptions {
  ttlSeconds: number;
  isPrivate?: boolean;
  staleWhileRevalidateSeconds?: number;
}

export function applyCacheHeaders(response: Response, options: CacheHeaderOptions): void {
  const { ttlSeconds, isPrivate = true } = options;
  const staleWhileRevalidateSeconds =
    options.staleWhileRevalidateSeconds ?? Math.max(ttlSeconds, ttlSeconds * 2);

  if (isPrivate) {
    response.setHeader(
      'Cache-Control',
      `private, max-age=${ttlSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`,
    );
    response.setHeader('Vary', 'Authorization, Cookie');
    return;
  }

  response.setHeader(
    'Cache-Control',
    `public, max-age=0, s-maxage=${ttlSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`,
  );
}
