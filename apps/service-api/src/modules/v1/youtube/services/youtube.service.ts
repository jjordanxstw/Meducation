/**
 * YouTube Service
 * Turns a playlist link (or pasted video links) into importable lecture rows
 * for the admin playlist importer.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@medical-portal/shared';
import { AppException } from '../../../../common/errors';

export interface ResolvedVideo {
  videoId: string;
  url: string;
  title: string;
  durationSeconds: number | null;
  /** 0-based position in the playlist / pasted list. */
  position: number;
}

const MAX_ITEMS = 200;
const REQUEST_TIMEOUT_MS = 8000;
const VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

/** "PT1H2M3S" → 3723. */
export function parseIsoDuration(value: string | undefined): number | null {
  const match = value?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const [, h, m, s] = match;
  return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}

export function extractPlaylistId(input: string): string | null {
  const match = input.match(/[?&]list=([a-zA-Z0-9_-]{10,64})/);
  return match ? match[1] : null;
}

/** Every distinct video ID found in the text (URLs of any YouTube shape, or bare IDs). */
export function extractVideoIds(input: string): string[] {
  const ids: string[] = [];
  for (const token of input.split(/[\s,]+/).filter(Boolean)) {
    let id: string | null = null;
    if (VIDEO_ID.test(token)) {
      id = token;
    } else {
      try {
        const url = new URL(token);
        const host = url.hostname.replace(/^www\.|^m\./, '');
        if (host === 'youtu.be') {
          id = url.pathname.split('/').filter(Boolean)[0] ?? null;
        } else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
          id = url.searchParams.get('v');
          if (!id) {
            const parts = url.pathname.split('/').filter(Boolean);
            const marker = parts.findIndex((part) => ['embed', 'shorts', 'live', 'v'].includes(part));
            id = marker >= 0 ? parts[marker + 1] ?? null : null;
          }
        }
      } catch {
        id = null;
      }
    }
    if (id && VIDEO_ID.test(id) && !ids.includes(id)) ids.push(id);
  }
  return ids.slice(0, MAX_ITEMS);
}

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);

  constructor(private readonly configService: ConfigService) {}

  async resolve(input: string): Promise<{ source: 'playlist' | 'links'; items: ResolvedVideo[] }> {
    const text = (input ?? '').trim();
    if (!text) {
      throw new AppException(ErrorCode.VALIDATION_INVALID_INPUT, { field: 'input' }, 'Paste a playlist link or video links');
    }

    const playlistId = extractPlaylistId(text);
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY')?.trim();
    if (playlistId && apiKey) {
      return { source: 'playlist', items: await this.fromPlaylist(playlistId, apiKey) };
    }

    const ids = extractVideoIds(text);
    if (ids.length === 0) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: 'input' },
        playlistId
          ? 'Whole-playlist import needs YOUTUBE_API_KEY on the API. Paste the video links (one per line) instead.'
          : 'No YouTube links found. Paste a playlist link or one video link per line.',
      );
    }

    const items = apiKey ? await this.fromVideoApi(ids, apiKey) : await this.fromOEmbed(ids);
    return { source: 'links', items };
  }

  private async getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) {
      this.logger.warn(`YouTube request failed (status=${response.status})`);
      throw new AppException(
        ErrorCode.RESOURCE_OPERATION_FAILED,
        { resource: 'youtube' },
        response.status === 404 ? 'Playlist or video not found (is it private?)' : 'YouTube did not respond. Try again.',
      );
    }
    return (await response.json()) as T;
  }

  private async fromPlaylist(playlistId: string, apiKey: string): Promise<ResolvedVideo[]> {
    const videoIds: string[] = [];
    let pageToken = '';
    while (videoIds.length < MAX_ITEMS) {
      const params = new URLSearchParams({ part: 'contentDetails', maxResults: '50', playlistId, key: apiKey });
      if (pageToken) params.set('pageToken', pageToken);
      const page = await this.getJson<{
        items?: Array<{ contentDetails?: { videoId?: string } }>;
        nextPageToken?: string;
      }>(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
      for (const item of page.items ?? []) {
        const id = item.contentDetails?.videoId;
        if (id && !videoIds.includes(id)) videoIds.push(id);
      }
      if (!page.nextPageToken) break;
      pageToken = page.nextPageToken;
    }
    return this.fromVideoApi(videoIds.slice(0, MAX_ITEMS), apiKey);
  }

  /** Titles + durations in batches of 50 (1 quota unit per batch). */
  private async fromVideoApi(ids: string[], apiKey: string): Promise<ResolvedVideo[]> {
    const found = new Map<string, { title: string; duration: number | null }>();
    for (let i = 0; i < ids.length; i += 50) {
      const params = new URLSearchParams({ part: 'snippet,contentDetails', id: ids.slice(i, i + 50).join(','), key: apiKey });
      const page = await this.getJson<{
        items?: Array<{ id: string; snippet?: { title?: string }; contentDetails?: { duration?: string } }>;
      }>(`https://www.googleapis.com/youtube/v3/videos?${params}`);
      for (const item of page.items ?? []) {
        found.set(item.id, { title: item.snippet?.title ?? '', duration: parseIsoDuration(item.contentDetails?.duration) });
      }
    }
    // Private/deleted videos are missing from the response; keep them so the admin sees them.
    return ids.map((videoId, position) => ({
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: found.get(videoId)?.title || 'Unavailable video (private or deleted)',
      durationSeconds: found.get(videoId)?.duration ?? null,
      position,
    }));
  }

  /** No API key: oEmbed gives titles (no durations), a few requests at a time. */
  private async fromOEmbed(ids: string[]): Promise<ResolvedVideo[]> {
    const results: ResolvedVideo[] = [];
    for (let i = 0; i < ids.length; i += 5) {
      const batch = ids.slice(i, i + 5);
      const titles = await Promise.all(
        batch.map(async (videoId) => {
          try {
            const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
            const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
            if (!response.ok) return null;
            return ((await response.json()) as { title?: string }).title ?? null;
          } catch {
            return null;
          }
        }),
      );
      batch.forEach((videoId, offset) =>
        results.push({
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title: titles[offset] || 'Unavailable video (private or deleted)',
          durationSeconds: null,
          position: i + offset,
        }),
      );
    }
    return results;
  }
}
