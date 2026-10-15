import { MonitorPlay, Video, FileText, ExternalLink, Link2 } from 'lucide-react';
import { ResourceType } from '@medical-portal/shared';
import type { ReactNode } from 'react';

type TagConfig = {
  label: string;
  className: string;
  icon: ReactNode;
};

const CONFIG: Record<string, TagConfig> = {
  [ResourceType.YOUTUBE]: {
    label: 'YouTube',
    className: 'border-red-200 bg-red-50 text-red-600',
    icon: <MonitorPlay className="size-3" />,
  },
  [ResourceType.GDRIVE_VIDEO]: {
    label: 'GDrive Video',
    className: 'border-blue-200 bg-blue-50 text-blue-600',
    icon: <Video className="size-3" />,
  },
  [ResourceType.GDRIVE_PDF]: {
    label: 'GDrive PDF',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    icon: <FileText className="size-3" />,
  },
  [ResourceType.EXTERNAL]: {
    label: 'External',
    className: 'border-purple-200 bg-purple-50 text-purple-600',
    icon: <ExternalLink className="size-3" />,
  },
};

const FALLBACK: TagConfig = {
  label: 'Unknown',
  className: 'border-slate-200 bg-slate-50 text-slate-500',
  icon: <FileText className="size-3" />,
};

const COMPACT: Record<string, { icon: ReactNode; className: string }> = {
  [ResourceType.YOUTUBE]: { icon: <MonitorPlay className="size-4" />, className: 'text-brand' },
  [ResourceType.GDRIVE_VIDEO]: { icon: <Video className="size-4" />, className: 'text-ink-2' },
  [ResourceType.GDRIVE_PDF]: { icon: <FileText className="size-4" />, className: 'text-red-600' },
  [ResourceType.EXTERNAL]: { icon: <Link2 className="size-4" />, className: 'text-ink-2' },
};

/**
 * Color-coded pill for a resource's content type. `compact` renders just the
 * icon (with the type as its accessible name) for dense tables.
 */
export function ResourceTypeTag({ type, compact = false }: { type: string; compact?: boolean }) {
  const config = CONFIG[type] ?? FALLBACK;
  if (compact) {
    const icon = COMPACT[type] ?? { icon: config.icon, className: 'text-ink-3' };
    return (
      <span className={`inline-flex ${icon.className}`} title={config.label} role="img" aria-label={config.label}>
        {icon.icon}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

export default ResourceTypeTag;
