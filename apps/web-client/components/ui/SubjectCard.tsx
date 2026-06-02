'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { HighlightText } from '@/components/ui/HighlightText';
import { usePrefetchSubject } from '@/hooks/use-subjects';

interface SubjectCardProps {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  yearLevel: number;
  /** Optional cover image shown as a band on top of the card. */
  thumbnailUrl?: string | null;
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
  thumbnailUrl,
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
        className="flex h-full min-h-[14rem] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle transition-all duration-200 group-hover:-translate-y-1 group-hover:border-brand/40 group-hover:shadow-soft"
      >
        {/* Cover band: image when present, otherwise a subtle branded placeholder
            so the grid stays uniform. */}
        <div className="relative h-28 w-full shrink-0 overflow-hidden bg-brand-subtle sm:h-32 lg:h-36">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt={`${code} cover`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand/30">
              <BookOpen className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
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
            <ArrowUpRight className="ml-auto h-4 w-4 text-slate-300 transition-colors group-hover:text-brand" />
          </div>
        </div>
      </div>
    </Link>
  );
}
