import { ExternalLink, FileText, PlayCircle } from 'lucide-react';
import { ResourceType } from '@medical-portal/shared';
import type { Resource } from '@medical-portal/shared';

/** Icon for a lecture resource: play for video, document for PDF, link otherwise. */
export function ResourceIcon({ resource, className }: { resource: Pick<Resource, 'type'>; className?: string }) {
  if (resource.type === ResourceType.YOUTUBE || resource.type === ResourceType.GDRIVE_VIDEO) {
    return <PlayCircle className={className} aria-hidden />;
  }
  if (resource.type === ResourceType.GDRIVE_PDF) {
    return <FileText className={className} aria-hidden />;
  }
  return <ExternalLink className={className} aria-hidden />;
}
