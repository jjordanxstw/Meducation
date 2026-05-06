'use client';

/**
 * Subjects Page - List all subjects
 * Next.js adapted version
 * Reads year filter from URL query param
 */

import { useState, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardBody,
  Input,
  Skeleton,
} from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { FiSearch, FiBook } from 'react-icons/fi';
import type { Subject } from '@medical-portal/shared';
import { SubjectCard } from '@/components/ui/SubjectCard';
import { usePathname, useRouter } from '@/i18n/routing';

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
      className={`px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)] ${
        isActive
          ? 'bg-blue-600 text-white font-semibold shadow-[var(--shadow-sm)] ring-2 ring-blue-200/70 dark:ring-blue-400/35'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-white/50 dark:hover:text-white/80 dark:hover:bg-white/[0.08]'
      }`}
    >
      {children}
    </button>
  );
}

// Skeleton loader for subject cards - 1:1 aspect ratio
function SubjectSkeletonGrid() {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="aspect-square rounded-2xl bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10" />
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-white/[0.03] p-4" style={{ height: 'calc(50% - 1.5px)' }}>
            <Skeleton className="w-14 h-14 rounded-2xl" />
          </div>
          <div className="p-4 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-14 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Placeholder card for when there's only 1 subject
function PlaceholderCard() {
  return (
    <div className="aspect-square border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center opacity-30">
      <FiBook className="h-10 w-10 text-slate-300 dark:text-white/30 mb-2" />
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
          <div className="h-8 w-48 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-72 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
      </div>
      <div className="flex flex-wrap gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-11 w-20 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse" />
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

  const { data, isLoading } = useQuery({
    queryKey: ['subjects', selectedYear === 'all' ? undefined : selectedYear],
    queryFn: () => {
      if (selectedYear === 'all') {
        return api.subjects.list(undefined);
      }
      return api.subjects.list(parseInt(selectedYear));
    },
  });

  const subjects: Subject[] = data?.data?.data || [];

  // Filter subjects by search query
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
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
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold text-[var(--ink-1)] sm:text-3xl">All Subjects</h1>
          <p className="text-base text-[var(--ink-2)]">Select subjects you want to study</p>
        </div>

        {/* Search bar with improved focus ring */}
        <Input
          placeholder="Search subjects..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={
            <span className="icon-with-text">
              <FiSearch className="h-4 w-4 text-slate-400 dark:text-white/40" />
            </span>
          }
          classNames={{
            inputWrapper: 'bg-[var(--bg-surface)] border border-slate-200 dark:border-white/10 ring-2 ring-transparent focus-within:ring-2 focus-within:ring-brand/40 focus-within:border-brand transition-all rounded-xl shadow-[var(--shadow-subtle)]',
            input: 'text-sm text-[var(--ink-1)] placeholder:text-[var(--ink-3)]',
          }}
          className="w-full sm:w-72"
        />
      </div>

      {/* Year Filter Tabs - pill only, no underline */}
      <div className="flex flex-wrap gap-1">
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
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              id={subject.id}
              code={subject.code}
              name={subject.name}
              description={subject.description}
              yearLevel={subject.year_level}
              thumbnailUrl={subject.thumbnail_url}
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
            <div className="empty-state-icon flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/[0.08]">
              <FiBook className="h-6 w-6 text-slate-400 dark:text-slate-400" />
            </div>
            <h3 className="empty-state-heading text-slate-700 dark:text-slate-200">No Subjects Found</h3>
            <p className="empty-state-subtext text-slate-500 dark:text-slate-400">
              {searchQuery
                ? `No subjects found matching "${searchQuery}"`
                : 'No subjects available in the system'}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
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
