'use client';

/**
 * Subtle background-refresh indicator. Shows a small pulsing amber dot in the
 * top-right of a section while React Query is refetching already-rendered data
 * (stale-while-revalidate). Renders nothing when data is fresh — a persistent
 * "fresh" dot would just be noise.
 */
export function DataFreshnessDot({ isFetching }: { isFetching: boolean }) {
  if (!isFetching) return null;

  return (
    <span
      className="absolute right-2 top-2 h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"
      role="status"
      aria-label="Refreshing"
      title="Refreshing..."
    />
  );
}
