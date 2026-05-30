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
    className: 'border-red-200 bg-red-50 text-red-600',
    icon: <YoutubeOutlined style={{ fontSize: 12 }} />,
  },
  [ResourceType.GDRIVE_VIDEO]: {
    label: 'GDrive Video',
    className: 'border-blue-200 bg-blue-50 text-blue-600',
    icon: <VideoCameraOutlined style={{ fontSize: 12 }} />,
  },
  [ResourceType.GDRIVE_PDF]: {
    label: 'GDrive PDF',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    icon: <FileTextOutlined style={{ fontSize: 12 }} />,
  },
  [ResourceType.EXTERNAL]: {
    label: 'External',
    className: 'border-purple-200 bg-purple-50 text-purple-600',
    icon: <ExportOutlined style={{ fontSize: 12 }} />,
  },
};

const FALLBACK: TagConfig = {
  label: 'Unknown',
  className: 'border-slate-200 bg-slate-50 text-slate-500',
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
