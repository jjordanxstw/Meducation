'use client';

/**
 * Subjects Page — list all subjects, filter by year, search.
 * Tailwind + Radix primitives only.
 */

import { useState, Suspense, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';
import { Search, Book, X } from 'lucide-react';
import { SubjectCard } from '@/components/ui/SubjectCard';
import { PageTransition } from '@/components/PageTransition';
import { DataFreshnessDot } from '@/components/ui/DataFreshnessDot';
import { useDebounce } from '@/hooks/use-debounce';
import { useSubjects } from '@/hooks/use-subjects';

const YEAR_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: '1', label: 'Year 1' },
  { key: '2', label: 'Year 2' },
  { key: '3', label: 'Year 3' },
];

function YearFilterTab({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[40px] shrink-0 rounded-full px-4 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
        isActive
          ? 'bg-brand font-semibold text-white shadow-subtle'
          : 'font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function SubjectSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex h-44 flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white p-4">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <div className="mt-auto flex gap-2 pt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SubjectsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-64 animate-pulse rounded-lg bg-slate-200" />
      </div>
      <SubjectSkeletonGrid />
    </div>
  );
}

function SubjectsContent() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get('year');
  const queryParam = searchParams.get('q') ?? '';

  const selectedYear = useMemo(() => {
    if (yearParam === 'all') return 'all';
    if (yearParam && ['1', '2', '3', '4', '5', '6'].includes(yearParam)) return yearParam;
    return profile?.year_level?.toString() || 'all';
  }, [yearParam, profile?.year_level]);

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Seed the field when arriving via the top-bar search (?q=...). This only
  // fires when the URL's `q` changes, so typing in this field never fights it.
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const handleYearSelect = useCallback(
    (nextYear: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('year', nextYear);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const { data: subjects = [], isLoading, isFetching } = useSubjects({ yearLevel: selectedYear });

  const query = debouncedQuery.trim().toLowerCase();
  const filteredSubjects = subjects.filter((subject) => {
    if (!query) return true;
    return subject.name.toLowerCase().includes(query) || subject.code.toLowerCase().includes(query);
  });

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">Subjects</h1>
          <p className="text-base text-slate-500">Browse and open the subjects you want to study.</p>
        </div>

        <Input
          aria-label="Search subjects"
          placeholder="Search subjects…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="h-4 w-4" />}
          endContent={
            searchQuery ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null
          }
          wrapperClassName="w-full sm:w-72"
        />
      </div>

      {/* Year filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide sm:flex-wrap sm:overflow-visible">
        {YEAR_OPTIONS.map((option) => (
          <YearFilterTab
            key={option.key}
            isActive={selectedYear === option.key}
            onClick={() => handleYearSelect(option.key)}
          >
            {option.label}
          </YearFilterTab>
        ))}
      </div>

      {/* Grid / states */}
      {isLoading ? (
        <SubjectSkeletonGrid />
      ) : filteredSubjects.length > 0 ? (
        <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <DataFreshnessDot isFetching={isFetching && !isLoading} />
          {filteredSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              id={subject.id}
              code={subject.code}
              name={subject.name}
              description={subject.description}
              yearLevel={subject.year_level}
              searchQuery={debouncedQuery}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-6 py-16 text-center shadow-subtle">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-subtle">
            <Book className="h-6 w-6 text-brand" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-slate-900">No subjects found</h3>
          <p className="text-sm text-slate-500">
            {debouncedQuery
              ? `Nothing matches “${debouncedQuery}”.`
              : 'No subjects available for this year yet.'}
          </p>
          {debouncedQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
              Clear search
            </button>
          )}
        </div>
      )}
    </PageTransition>
  );
}

export default function SubjectsPage() {
  return (
    <Suspense fallback={<SubjectsLoading />}>
      <SubjectsContent />
    </Suspense>
  );
}
