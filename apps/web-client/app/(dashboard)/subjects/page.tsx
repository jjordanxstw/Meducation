'use client';

/**
 * Subjects Page - List all subjects
 * Next.js adapted version
 */

import { useState } from 'react';
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
      className={`px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-0)] ${
        isActive
          ? 'bg-blue-600 text-white font-semibold'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-white/50 dark:hover:text-white/80 dark:hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  );
}

// Skeleton loader for subject cards
function SubjectSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="glass-surface overflow-hidden h-[200px]">
          <CardBody className="p-0">
            <Skeleton className="h-24 w-full rounded-none" />
            <div className="space-y-2 p-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

// Placeholder card for when there's only 1 subject
function PlaceholderCard() {
  return (
    <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center h-[200px] opacity-30">
      <FiBook className="h-8 w-8 text-slate-300 dark:text-white/30 mb-2" />
      <p className="text-slate-500 text-sm">More subjects available soon</p>
    </div>
  );
}

export default function SubjectsPage() {
  const { profile } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState<string>(
    profile?.year_level?.toString() || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['subjects', selectedYear === 'all' ? undefined : parseInt(selectedYear)],
    queryFn: () =>
      api.subjects.list(selectedYear === 'all' ? undefined : parseInt(selectedYear)),
  });

  const subjects: Subject[] = data?.data?.data || [];

  // Filter subjects by search query
  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            inputWrapper: 'card-flat ring-2 ring-transparent focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all rounded-xl',
            input: 'text-sm',
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
            onClick={() => setSelectedYear(option.key)}
          >
            {option.label}
          </YearFilterTab>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <SubjectSkeletonGrid />
      ) : filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
        <Card className="glass-surface">
          <CardBody className="text-center py-16">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-default-100/50">
              <FiBook className="h-6 w-6 text-slate-400 dark:text-default-400 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-white/80 mb-1">No Subjects Found</h3>
            <p className="text-sm text-slate-500 dark:text-white/50">
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
