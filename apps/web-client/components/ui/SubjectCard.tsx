'use client';

import { FiBook, FiArrowRight } from 'react-icons/fi';
import Image from 'next/image';
import { useState } from 'react';
import { Link } from '@/i18n/routing';

interface SubjectCardProps {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  yearLevel: number;
  thumbnailUrl?: string | null;
  progress?: number; // Progress percentage (optional)
  href?: string;
}

// Accent color per year
const YEAR_COLORS: Record<number, string> = {
  1: '#FB923C', // orange-400
  2: '#4ADE80', // green-400
  3: '#60A5FA', // blue-400
  4: '#C084FC', // purple-400
};

const DEFAULT_COLOR = '#CBD5E1'; // slate-300

function getYearColor(yearLevel: number): string {
  return YEAR_COLORS[yearLevel] || DEFAULT_COLOR;
}

function SubjectThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/8 flex items-center justify-center">
        <FiBook size={28} className="text-slate-400 dark:text-white/30" />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/8">
      <Image
        src={src}
        alt={alt}
        width={56}
        height={56}
        className="object-cover w-full h-full"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function SubjectCard({
  id,
  code,
  name,
  description,
  yearLevel,
  thumbnailUrl,
  progress,
  href = `/subjects/${id}`,
}: SubjectCardProps) {
  const accentColor = getYearColor(yearLevel);

  return (
    <Link href={href} className="block">
      <div
        className="relative aspect-square rounded-2xl overflow-hidden
        bg-white dark:bg-[#0d1b2e]
        border border-slate-200 dark:border-white/10
        hover:border-blue-300 dark:hover:border-blue-500/40
        hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20
        cursor-pointer transition-all duration-200 group
        flex flex-col"
      >
        {/* Top accent bar (colored per year) */}
        <div
          className="h-1.5 w-full shrink-0"
          style={{ background: accentColor }}
        />

        {/* Icon area — takes up top ~45% */}
        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-white/[0.03] p-4">
          <SubjectThumbnail src={thumbnailUrl} alt={name} />
        </div>

        {/* Info area — bottom ~55% */}
        <div className="p-4 flex flex-col gap-1 shrink-0">
          {/* Code + Year badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-white/50">
              {code}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20">
              Year {yearLevel}
            </span>
          </div>

          {/* Subject name */}
          <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight line-clamp-2 mt-1">
            {name}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-400 dark:text-white/40 line-clamp-1">
            {description || 'No description'}
          </p>

          {/* Progress bar (if provided) */}
          {progress !== undefined && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-white/50">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Open button — visible on hover */}
          <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
            <span className="text-xs text-blue-500 dark:text-blue-400 font-medium flex items-center gap-1">
              Open <FiArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
