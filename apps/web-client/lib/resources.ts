import { ResourceType } from '@medical-portal/shared';
import type { LectureWithResources, Resource } from '@medical-portal/shared';

/** Video resources play inline on the lecture page; everything else opens in a tab. */
export function isVideoResource(resource: Pick<Resource, 'type'>): boolean {
  return resource.type === ResourceType.YOUTUBE || resource.type === ResourceType.GDRIVE_VIDEO;
}

export function resourceKindLabel(resource: Pick<Resource, 'type'>): string {
  switch (resource.type) {
    case ResourceType.YOUTUBE:
      return 'YouTube';
    case ResourceType.GDRIVE_VIDEO:
      return 'Drive video';
    case ResourceType.GDRIVE_PDF:
      return 'PDF';
    default:
      return 'Link';
  }
}

export function primaryVideo(lecture: Pick<LectureWithResources, 'resources'>): Resource | undefined {
  return lecture.resources?.find(isVideoResource);
}

export function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Matches the API's "new" window for subject cards (7 days since upload). */
export function isNewLecture(createdAt: string | null | undefined, now = Date.now()): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  return Number.isFinite(created) && now - created < 7 * DAY_MS;
}
