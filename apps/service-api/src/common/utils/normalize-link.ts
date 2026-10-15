/** Compare links loosely: YouTube by video id, everything else without query noise. */
export function normalizeLink(url: string): string {
  const trimmed = url.trim();
  const youtube = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  if (youtube) return `youtube:${youtube[1]}`;
  const drive = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (drive) return `drive:${drive[1]}`;
  return trimmed.toLowerCase().replace(/[?#].*$/, '').replace(/\/$/, '');
}
