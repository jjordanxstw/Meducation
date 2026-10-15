'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { HighlightText } from '@/components/ui/HighlightText';
import { SubjectGlyph } from '@/components/ui/SubjectGlyph';
import { usePrefetchSubject } from '@/hooks/use-subjects';
import { cn } from '@/lib/utils';

interface SubjectCardProps {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  /** Cover image (subjects.thumbnail_url); a tinted cover with a glyph stands in when absent. */
  thumbnailUrl?: string | null;
  sectionsCount?: number | null;
  lecturesCount?: number | null;
  filesCount?: number | null;
  /** Lectures uploaded in the last 7 days — shows the "N new" badge. */
  newLecturesCount?: number | null;
  /** When set, matching characters in the name are highlighted. */
  searchQuery?: string;
  /** Compact (Today): name + counts only; full (Subjects): adds the description and files. */
  variant?: 'full' | 'compact';
  className?: string;
}

/**
 * Near-square subject card (Brilliant: Subjects / Today). Cover with the
 * subject code chip, a "new lectures" badge and a line-art glyph; then the
 * name, an optional description and the counts. No progress state — MedPi is
 * a library, not a course.
 */
export function SubjectCard({
  id,
  code,
  name,
  description,
  thumbnailUrl,
  sectionsCount,
  lecturesCount,
  filesCount,
  newLecturesCount,
  searchQuery = '',
  variant = 'full',
  className,
}: SubjectCardProps) {
  const prefetchSubject = usePrefetchSubject();
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const empty = lecturesCount === 0;

  const startPrefetch = () => {
    if (prefetchTimer.current) return;
    prefetchTimer.current = setTimeout(() => void prefetchSubject(id), 150);
  };
  const cancelPrefetch = () => {
    if (prefetchTimer.current) {
      clearTimeout(prefetchTimer.current);
      prefetchTimer.current = null;
    }
  };

  const counts = [
    typeof sectionsCount === 'number' ? `${sectionsCount} ${sectionsCount === 1 ? 'section' : 'sections'}` : null,
    typeof lecturesCount === 'number' ? `${lecturesCount} ${lecturesCount === 1 ? 'lecture' : 'lectures'}` : null,
    variant === 'full' && typeof filesCount === 'number' ? `${filesCount} ${filesCount === 1 ? 'file' : 'files'}` : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/subjects/${id}`}
      onMouseEnter={startPrefetch}
      onMouseLeave={cancelPrefetch}
      onFocus={startPrefetch}
      onBlur={cancelPrefetch}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft',
        empty && 'opacity-75',
        className,
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden',
          variant === 'full' ? 'aspect-[16/9]' : 'aspect-[16/10]',
          empty ? 'bg-slate-100' : 'bg-brand-subtle',
        )}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <SubjectGlyph
            name={name}
            className={cn(
              'absolute bottom-3 right-3 h-10 w-10 sm:h-12 sm:w-12',
              empty ? 'text-ink-4' : 'text-ink-2/80',
            )}
          />
        )}
        <span className="absolute left-2.5 top-2.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[11px] font-semibold text-ink-1 shadow-subtle">
          {code}
        </span>
        {newLecturesCount ? (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
            {newLecturesCount} new{variant === 'full' ? ` ${newLecturesCount === 1 ? 'lecture' : 'lectures'}` : ''}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <h3 className={cn('line-clamp-2 text-sm font-semibold leading-snug sm:text-[15px]', empty ? 'text-ink-2' : 'text-ink-1')}>
          <HighlightText text={name} query={searchQuery} />
        </h3>
        {variant === 'full' && description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-3 sm:text-[13px]">
            {empty ? 'Lectures appear here once they are uploaded.' : description}
          </p>
        ) : null}
        <p className="mt-auto pt-1 text-xs text-ink-3 tabular">{empty ? 'No lectures yet' : counts.join(' · ')}</p>
      </div>
    </Link>
  );
}
