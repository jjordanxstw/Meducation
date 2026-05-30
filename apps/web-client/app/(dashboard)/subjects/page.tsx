'use client';

/**
 * Subjects Page - List all subjects
 * Next.js adapted version
 * Reads year filter from URL query param
 */

import { useState, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import {
  Card,
  CardBody,
  Input,
  Skeleton,
} from '@heroui/react';
import { useAuthStore } from '@/stores/auth.store';
import { FiSearch, FiBook, FiX } from 'react-icons/fi';
import { SubjectCard } from '@/components/ui/SubjectCard';
import { PageTransition } from '@/components/PageTransition';
import { DataFreshnessDot } from '@/components/ui/DataFreshnessDot';
import { useDebounce } from '@/hooks/use-debounce';
import { useSubjects } from '@/hooks/use-subjects';

// Year filter tab component - pill only, no underline
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
      className={`shrink-0 px-4 py-2.5 text-sm font-medium rounded-full transition-[background,box-shadow,transform,color] duration-200 ease-out min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)] ${
        isActive
          ? 'scale-105 bg-[#0070F3] text-white font-semibold shadow-lg shadow-blue-500/25'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

// Skeleton loader for subject cards — matches the fixed-height card layout
function SubjectSkeletonGrid() {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex h-40 min-h-[10rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Accent bar */}
          <div className="h-1 w-full bg-slate-200" />
          <div className="flex flex-1 flex-col gap-2 p-4">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <div className="mt-auto flex gap-2 pt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Placeholder card for when there's only 1 subject
function PlaceholderCard() {
  return (
    <div className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center opacity-30">
      <FiBook className="h-10 w-10 text-slate-300 mb-2" />
      <p className="text-slate-500 text-sm">More subjects soon</p>
    </div>
  );
}

// Loading fallback for Suspense
function SubjectsLoading() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-72 bg-slate-200 rounded-lg animate-pulse" />
      </div>
      <div className="flex flex-wrap gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-11 w-20 bg-slate-200 rounded-full animate-pulse" />
        ))}
      </div>
      <SubjectSkeletonGrid />
    </div>
  );
}

// Main subjects content component that uses useSearchParams
function SubjectsContent() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get('year');

  const selectedYear = useMemo(() => {
    if (yearParam === 'all') {
      return 'all';
    }
    if (yearParam && ['1', '2', '3', '4', '5', '6'].includes(yearParam)) {
      return yearParam;
    }
    return profile?.year_level?.toString() || 'all';
  }, [yearParam, profile?.year_level]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const handleYearSelect = useCallback((nextYear: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextYear === 'all') {
      params.set('year', 'all');
    } else {
      params.set('year', nextYear);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  const { data: subjects = [], isLoading, isFetching } = useSubjects({ yearLevel: selectedYear });

  // Filter subjects by the debounced search query
  const query = debouncedQuery.trim().toLowerCase();
  const filteredSubjects = subjects.filter((subject) => {
    if (!query) return true;
    return (
      subject.name.toLowerCase().includes(query) ||
      subject.code.toLowerCase().includes(query)
    );
  });

  // Year options (removed Fast Track)
  const yearOptions = [
    { key: 'all', label: 'All' },
    { key: '1', label: 'Year 1' },
    { key: '2', label: 'Year 2' },
    { key: '3', label: 'Year 3' },
  ];

  // Check if we need a placeholder (only 1 subject on desktop)
  const needsPlaceholder = filteredSubjects.length === 1;

  return (
    <PageTransition className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold text-[var(--ink-1)] sm:text-3xl">All Subjects</h1>
          <p className="text-base text-[var(--ink-2)]">Select subjects you want to study</p>
        </div>

        {/* Search bar with improved focus ring + clear button */}
        <Input
          placeholder="Search subjects..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={
            <span className="icon-with-text">
              <FiSearch className="h-4 w-4 text-slate-400" />
            </span>
          }
          endContent={
            searchQuery ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            ) : null
          }
          classNames={{
            inputWrapper: 'bg-[var(--bg-surface)] border border-slate-200 ring-2 ring-transparent focus-within:ring-2 focus-within:ring-brand/40 focus-within:border-brand transition-all rounded-xl shadow-[var(--shadow-subtle)]',
            input: 'text-sm text-[var(--ink-1)] placeholder:text-[var(--ink-3)]',
          }}
          className="w-full sm:w-72"
        />
      </div>

      {/* Year Filter Tabs - pill only, no underline */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide sm:flex-wrap sm:overflow-visible">
        {yearOptions.map((option) => (
          <YearFilterTab
            key={option.key}
            isActive={selectedYear === option.key}
            onClick={() => handleYearSelect(option.key)}
          >
            {option.label}
          </YearFilterTab>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <SubjectSkeletonGrid />
      ) : filteredSubjects.length > 0 ? (
        <div className="relative grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
          {/* Add placeholder if only 1 subject on larger screens */}
          {needsPlaceholder && (
            <div className="hidden sm:block">
              <PlaceholderCard />
            </div>
          )}
        </div>
      ) : (
        <Card className="card-flat">
          <CardBody className="empty-state">
            <div className="empty-state-icon flex items-center justify-center rounded-full bg-slate-100">
              <FiBook className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="empty-state-heading text-slate-700">No Subjects Found</h3>
            <p className="empty-state-subtext text-slate-500">
              {debouncedQuery
                ? `No subjects found for "${debouncedQuery}"`
                : 'No subjects available in the system'}
            </p>
            {debouncedQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                <FiX className="h-3.5 w-3.5" />
                Clear search
              </button>
            )}
          </CardBody>
        </Card>
      )}
    </PageTransition>
  );
}

// Main page component with Suspense wrapper
export default function SubjectsPage() {
  return (
    <Suspense fallback={<SubjectsLoading />}>
      <SubjectsContent />
    </Suspense>
  );
}
