/**
 * Display dates the way students write them: "20 Oct", or "20 Oct 2025" when
 * the date is not in the current year. Date-only strings (YYYY-MM-DD) are read
 * as local dates so they never shift a day across time zones.
 */
export function formatDay(value: string | null | undefined, now = new Date()): string {
  if (!value) return '';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnly ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}
