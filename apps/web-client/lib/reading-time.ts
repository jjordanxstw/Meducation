/**
 * Estimate reading time in whole minutes from an article body (~200 wpm).
 * Markdown syntax is left in; it's a negligible fraction of real prose and the
 * estimate is intentionally coarse.
 */
export function readingTime(body: string | null | undefined): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
