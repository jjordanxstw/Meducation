'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { HighlightText } from '@/components/ui/HighlightText';
import { usePrefetchSubject } from '@/hooks/use-subjects';

interface SubjectCardProps {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  yearLevel: number;
  /** Optional lecture count — badge is hidden when not provided. */
  lectureCount?: number | null;
  /** When set, matching characters in the name are highlighted. */
  searchQuery?: string;
  href?: string;
}

// Accent gradient per year level (used for the 4px top bar).
const YEAR_GRADIENTS: Record<number, string> = {
  1: 'linear-gradient(90deg, #FB923C, #F97316)', // amber
  2: 'linear-gradient(90deg, #4ADE80, #22C55E)', // emerald
  3: 'linear-gradient(90deg, #60A5FA, #0070F3)', // blue
  4: 'linear-gradient(90deg, #C084FC, #A855F7)', // purple
  5: 'linear-gradient(90deg, #F472B6, #EC4899)', // rose
  6: 'linear-gradient(90deg, #2DD4BF, #14B8A6)', // teal
};

const DEFAULT_GRADIENT = 'linear-gradient(90deg, #94A3B8, #64748B)';

function getYearGradient(yearLevel: number): string {
  return YEAR_GRADIENTS[yearLevel] || DEFAULT_GRADIENT;
}

export function SubjectCard({
  id,
  code,
  name,
  description,
  yearLevel,
  lectureCount,
  searchQuery = '',
  href = `/subjects/${id}`,
}: SubjectCardProps) {
  const accentGradient = getYearGradient(yearLevel);
  const prefetchSubject = usePrefetchSubject();
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Warm the detail cache after a 150ms dwell so quick mouse-throughs don't
  // trigger needless fetches.
  const startPrefetch = () => {
    if (prefetchTimer.current) return;
    prefetchTimer.current = setTimeout(() => {
      void prefetchSubject(id);
    }, 150);
  };
  const cancelPrefetch = () => {
    if (prefetchTimer.current) {
      clearTimeout(prefetchTimer.current);
      prefetchTimer.current = null;
    }
  };

  return (
    <Link href={href} className="block">
      <div
        onMouseEnter={startPrefetch}
        onMouseLeave={cancelPrefetch}
        onFocus={startPrefetch}
        onBlur={cancelPrefetch}
        className="group flex h-40 min-h-[10rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[var(--bg-surface)] shadow-[var(--shadow-subtle)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
      >
        {/* Top accent bar (gradient per year) */}
        <div
          className="h-1 w-full shrink-0 transition-[filter] duration-200 group-hover:brightness-125"
          style={{ background: accentGradient }}
        />

        {/* Content */}
        <div className="flex flex-1 flex-col gap-1 p-4">
          <span className="font-mono text-xs text-slate-400">{code}</span>
          <h3 className="font-heading text-base font-semibold leading-tight text-slate-900 line-clamp-2">
            <HighlightText text={name} query={searchQuery} />
          </h3>
          {description ? (
            <p className="text-xs text-slate-500 line-clamp-2">{description}</p>
          ) : null}

          {/* Bottom row: year pill + lecture count badge */}
          <div className="mt-auto flex items-center gap-2 pt-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
              Year {yearLevel}
            </span>
            {typeof lectureCount === 'number' && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                {lectureCount} {lectureCount === 1 ? 'lecture' : 'lectures'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
