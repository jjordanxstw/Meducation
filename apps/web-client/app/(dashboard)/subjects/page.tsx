'use client';

/**
 * Subjects — every subject as a near-square card. Opens on the student's own
 * year ("your year first"); "All" groups every year with theirs on top.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Search, X } from 'lucide-react';
import { YEAR_LEVELS } from '@medical-portal/shared';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SubjectCard } from '@/components/ui/SubjectCard';
import { PageTransition } from '@/components/PageTransition';
import { DataFreshnessDot } from '@/components/ui/DataFreshnessDot';
import { EmptyState } from '@/components/states/EmptyState';
import { useDebounce } from '@/hooks/use-debounce';
import { useSubjects } from '@/hooks/use-subjects';
import { useStudyYear } from '@/lib/study-year';
import { cn } from '@/lib/utils';

const GRID = 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3';

function SubjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={GRID} aria-busy="true" aria-label="Loading subjects">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
          <Skeleton className="aspect-[16/9] rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function YearSegments({
  years,
  selected,
  ownYear,
  onSelect,
}: {
  years: readonly number[];
  selected: string;
  ownYear: number | null;
  onSelect: (year: string) => void;
}) {
  const options = [{ key: 'all', label: 'All' }, ...years.map((year) => ({ key: String(year), label: `Year ${year}` }))];
  return (
    <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
      <div className="inline-flex gap-0.5 rounded-xl bg-slate-200/60 p-1" role="group" aria-label="Filter by year">
        {options.map((option) => {
          const active = option.key === selected;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(option.key)}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-sm transition-colors',
                active ? 'bg-white font-semibold text-ink-1 shadow-subtle' : 'font-medium text-ink-2 hover:text-ink-1',
              )}
            >
              {option.label}
              {ownYear !== null && option.key === String(ownYear) ? (
                <span className="rounded bg-brand-subtle px-1 text-[10px] font-bold uppercase tracking-wide text-brand-hover">
                  You
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SubjectsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { year: studyYear } = useStudyYear();
  const yearParam = searchParams.get('year');
  const queryParam = searchParams.get('q') ?? '';

  // ?year= wins; otherwise open on the student's own year.
  const selectedYear = useMemo(() => {
    if (yearParam === 'all') return 'all';
    if (yearParam && YEAR_LEVELS.map(String).includes(yearParam)) return yearParam;
    return studyYear ? String(studyYear) : 'all';
  }, [yearParam, studyYear]);

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const debouncedQuery = useDebounce(searchQuery, 250);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const selectYear = useCallback(
    (year: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('year', year);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const { data: subjects = [], isLoading, isFetching, isError, refetch } = useSubjects({ yearLevel: 'all' });

  const query = debouncedQuery.trim().toLowerCase();
  const matchesQuery = (subject: (typeof subjects)[number]) =>
    !query || subject.name.toLowerCase().includes(query) || subject.code.toLowerCase().includes(query);
  // A search looks across every year so nothing hides behind the year filter.
  const filtered = subjects.filter(
    (subject) => matchesQuery(subject) && (query || selectedYear === 'all' || String(subject.year_level) === selectedYear),
  );

  const years = useMemo(() => {
    const present = new Set(subjects.map((subject) => subject.year_level));
    return present.size ? YEAR_LEVELS.filter((year) => present.has(year)) : YEAR_LEVELS;
  }, [subjects]);

  const grouped = useMemo(() => {
    if (selectedYear !== 'all' && !query) return null;
    const groups = new Map<number, typeof filtered>();
    for (const subject of filtered) {
      groups.set(subject.year_level, [...(groups.get(subject.year_level) ?? []), subject]);
    }
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === studyYear) return -1;
      if (b === studyYear) return 1;
      return a - b;
    });
  }, [selectedYear, query, filtered, studyYear]);

  const renderCard = (subject: (typeof subjects)[number]) => (
    <SubjectCard
      key={subject.id}
      id={subject.id}
      code={subject.code}
      name={subject.name}
      description={subject.description}
      thumbnailUrl={subject.thumbnail_url}
      sectionsCount={subject.sections_count}
      lecturesCount={subject.lectures_count}
      filesCount={subject.files_count}
      newLecturesCount={subject.new_lectures_count}
      searchQuery={debouncedQuery}
    />
  );

  return (
    <PageTransition className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-1">Subjects</h1>
          <p className="text-sm text-ink-3 sm:text-base">
            {subjects.length > 0 ? `${subjects.length} subjects across Years 1–6 · your year first` : 'Every subject and its recorded lectures'}
          </p>
        </div>
        <Input
          aria-label="Filter subjects"
          placeholder="Filter by name or code"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          startContent={<Search className="h-4 w-4" />}
          endContent={
            searchQuery ? (
              <button
                type="button"
                aria-label="Clear filter"
                onClick={() => setSearchQuery('')}
                className="flex h-6 w-6 items-center justify-center rounded-full text-ink-3 hover:bg-slate-100 hover:text-ink-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null
          }
          wrapperClassName="w-full sm:w-72"
        />
      </header>

      <YearSegments years={years} selected={query ? 'all' : selectedYear} ownYear={studyYear} onSelect={selectYear} />

      {isLoading ? (
        <SubjectGridSkeleton />
      ) : isError ? (
        <EmptyState
          tone="error"
          title="Couldn’t load subjects"
          description="Check your connection and try again."
          action={{ label: 'Try again', onClick: () => void refetch() }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={query ? `Nothing matches “${debouncedQuery.trim()}”` : 'No subjects for this year yet'}
          description={query ? 'Try a subject code like “MDCV” or clear the filter.' : 'New subjects appear here as soon as they are published.'}
          action={query ? { label: 'Clear filter', onClick: () => setSearchQuery('') } : undefined}
        />
      ) : grouped ? (
        <div className="relative space-y-10">
          <DataFreshnessDot isFetching={isFetching && !isLoading} />
          {grouped.map(([year, yearSubjects]) => (
            <section key={year} className="space-y-4" aria-labelledby={`year-${year}`}>
              <h2 id={`year-${year}`} className="flex items-baseline gap-2 text-lg font-semibold tracking-tight text-ink-1">
                Year {year}
                {year === studyYear ? <span className="text-sm font-medium text-brand-hover">your year</span> : null}
                <span className="text-sm font-normal text-ink-3">{yearSubjects.length} subjects</span>
              </h2>
              <div className={GRID}>{yearSubjects.map(renderCard)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className={cn(GRID, 'relative')}>
          <DataFreshnessDot isFetching={isFetching && !isLoading} />
          {filtered.map(renderCard)}
        </div>
      )}
    </PageTransition>
  );
}

export default function SubjectsPage() {
  return (
    <Suspense fallback={<SubjectGridSkeleton />}>
      <SubjectsContent />
    </Suspense>
  );
}
