'use client';

/**
 * Video Player Component.
 * Tailwind only.
 */

import { useEffect, useRef, useState } from 'react';
import { VideoOff, Maximize2, ExternalLink } from 'lucide-react';
import { getYouTubeEmbedUrl, ResourceType } from '@medical-portal/shared';
import type { Resource } from '@medical-portal/shared';

interface VideoPlayerProps {
  resource: Resource;
  lectureTitle: string;
}

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function normalizeYouTubeVideoId(value: string): string | null {
  const input = value.trim();
  if (!input) return null;

  if (YOUTUBE_ID_PATTERN.test(input)) {
    return input;
  }

  try {
    const parsedUrl = new URL(input);
    const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const shortId = parsedUrl.pathname.split('/').filter(Boolean)[0];
      return shortId && YOUTUBE_ID_PATTERN.test(shortId) ? shortId : null;
    }

    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const watchId = parsedUrl.searchParams.get('v');
      if (watchId && YOUTUBE_ID_PATTERN.test(watchId)) {
        return watchId;
      }

      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      const markerIndex = pathParts.findIndex((part) => ['embed', 'shorts', 'live', 'v'].includes(part));
      const pathId = markerIndex >= 0 ? pathParts[markerIndex + 1] : undefined;
      return pathId && YOUTUBE_ID_PATTERN.test(pathId) ? pathId : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function VideoPlayer({ resource, lectureTitle }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Reset load/error state when the played resource changes (the player is
  // reused across resources within a lecture).
  const [trackedId, setTrackedId] = useState(resource.id);
  if (trackedId !== resource.id) {
    setTrackedId(resource.id);
    setLoaded(false);
    setErrored(false);
  }

  // Timeout fallback: if the iframe hasn't loaded within 15s, treat as failed.
  useEffect(() => {
    if (loaded || errored) {
      return;
    }
    const timer = setTimeout(() => setErrored(true), 15000);
    return () => clearTimeout(timer);
  }, [loaded, errored, resource.id]);

  const handleFullscreen = () => {
    void containerRef.current?.requestFullscreen?.();
  };

  const getVideoUrl = () => {
    if (resource.type === ResourceType.YOUTUBE) {
      const videoId = normalizeYouTubeVideoId(resource.url);
      if (videoId) {
        return getYouTubeEmbedUrl(videoId);
      }

      // Fallback to the original value for backward compatibility with existing records.
      return resource.url;
    }
    // For Google Drive videos — append rm=minimal to strip extra Google UI.
    if (resource.type === ResourceType.GDRIVE_VIDEO) {
      // Extract file ID from various Google Drive URL formats
      const match = resource.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const fileId = match ? match[1] : resource.url;
      return `https://drive.google.com/file/d/${fileId}/preview?rm=minimal`;
    }
    return resource.url;
  };

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black"
    >
      {/* Error state — iframe failed or timed out */}
      {errored ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 text-center">
          <VideoOff className="h-12 w-12 text-white/40" />
          <p className="text-sm font-medium text-white/80">Video unavailable</p>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-300 hover:text-primary-200"
          >
            Open in new tab
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : (
        <>
          {/* Loading skeleton until the iframe fires onLoad */}
          {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-800" aria-hidden />}

          {/* Video iframe */}
          <iframe
            src={getVideoUrl()}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={lectureTitle}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />

          {/* Fullscreen button — appears on hover */}
          <button
            type="button"
            onClick={handleFullscreen}
            aria-label="Fullscreen"
            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-white/80 opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-black/70 hover:text-white group-hover:opacity-100"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
