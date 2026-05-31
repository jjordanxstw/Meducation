'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { FiArrowUpRight } from 'react-icons/fi';
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
    <Link href={href} className="group block">
      <div
        onMouseEnter={startPrefetch}
        onMouseLeave={cancelPrefetch}
        onFocus={startPrefetch}
        onBlur={cancelPrefetch}
        className="flex h-44 flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-subtle transition-all duration-200 group-hover:-translate-y-1 group-hover:border-brand/40 group-hover:shadow-soft"
      >
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">{code}</span>
        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900">
          <HighlightText text={name} query={searchQuery} />
        </h3>
        {description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{description}</p>
        ) : null}

        {/* Bottom row: year pill + lecture count + hover arrow */}
        <div className="mt-auto flex items-center gap-2 pt-3">
          <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-[11px] font-semibold text-brand">
            Year {yearLevel}
          </span>
          {typeof lectureCount === 'number' && (
            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500">
              {lectureCount} {lectureCount === 1 ? 'lecture' : 'lectures'}
            </span>
          )}
          <FiArrowUpRight className="ml-auto h-4 w-4 text-slate-300 transition-colors group-hover:text-brand" />
        </div>
      </div>
    </Link>
  );
}
