import { Response } from 'express';

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
