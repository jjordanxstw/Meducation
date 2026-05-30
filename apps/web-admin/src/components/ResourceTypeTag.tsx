import {
  YoutubeOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  ExportOutlined,
} from '@ant-design/icons';
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
    className: 'border-red-500/20 bg-red-500/15 text-red-400',
    icon: <YoutubeOutlined style={{ fontSize: 12 }} />,
  },
  [ResourceType.GDRIVE_VIDEO]: {
    label: 'GDrive Video',
    className: 'border-blue-500/20 bg-blue-500/15 text-blue-400',
    icon: <VideoCameraOutlined style={{ fontSize: 12 }} />,
  },
  [ResourceType.GDRIVE_PDF]: {
    label: 'GDrive PDF',
    className: 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400',
    icon: <FileTextOutlined style={{ fontSize: 12 }} />,
  },
  [ResourceType.EXTERNAL]: {
    label: 'External',
    className: 'border-purple-500/20 bg-purple-500/15 text-purple-400',
    icon: <ExportOutlined style={{ fontSize: 12 }} />,
  },
};

const FALLBACK: TagConfig = {
  label: 'Unknown',
  className: 'border-white/10 bg-white/[0.06] text-white/60',
  icon: <FileTextOutlined style={{ fontSize: 12 }} />,
};

/**
 * Color-coded pill for a resource's content type. Used in the resources table
 * and in the resource form's type selector for visual consistency.
 */
export function ResourceTypeTag({ type }: { type: string }) {
  const config = CONFIG[type] ?? FALLBACK;
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
