const VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

/** The 11-character video id from any common YouTube URL shape (or a bare id). */
export function youtubeVideoId(value: string): string | null {
  const input = value.trim();
  if (VIDEO_ID.test(input)) return input;
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\.|^m\./, '').toLowerCase();
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && VIDEO_ID.test(id) ? id : null;
    }
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const fromQuery = url.searchParams.get('v');
      if (fromQuery && VIDEO_ID.test(fromQuery)) return fromQuery;
      const parts = url.pathname.split('/').filter(Boolean);
      const marker = parts.findIndex((part) => ['embed', 'shorts', 'live', 'v'].includes(part));
      const fromPath = marker >= 0 ? parts[marker + 1] : undefined;
      return fromPath && VIDEO_ID.test(fromPath) ? fromPath : null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Medium-quality thumbnail served by YouTube's image CDN (no API key). */
export function youtubeThumbnail(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
}

export function youtubeWatchUrl(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}
