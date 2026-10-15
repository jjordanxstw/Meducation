import dayjs from 'dayjs';

/** "2 h ago", "Yesterday", "5 Oct" — the Updated column style. */
export function formatUpdated(value: string | null | undefined, now = dayjs()): string {
  if (!value) return '—';
  const date = dayjs(value);
  const minutes = now.diff(date, 'minute');
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 6 * 60) return `${Math.floor(minutes / 60)} h ago`;
  if (date.isSame(now, 'day')) return `Today ${date.format('HH:mm')}`;
  if (date.isSame(now.subtract(1, 'day'), 'day')) return 'Yesterday';
  return date.isSame(now, 'year') ? date.format('D MMM') : date.format('D MMM YYYY');
}

/** "2 h ago" / "3 days ago" for headers and banners. */
export function formatAgo(value: string | null | undefined, now = dayjs()): string {
  if (!value) return '';
  const minutes = Math.max(0, now.diff(dayjs(value), 'minute'));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

/** Audit actor shown as a short name: "nok@…" → "nok". */
export function actorName(email: string | null | undefined): string {
  if (!email) return 'Someone';
  return email.split('@')[0];
}
