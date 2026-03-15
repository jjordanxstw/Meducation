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
  Tabs,
  Tab,
} from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { FiSearch, FiBook } from 'react-icons/fi';
import type { Subject } from '@medical-portal/shared';
import { SubjectCard } from '@/components/ui/SubjectCard';
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

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold text-[var(--ink-1)] sm:text-3xl">All Subjects</h1>
          <p className="text-base text-[var(--ink-2)]">Select subjects you want to study</p>
        </div>

        <Input
          placeholder="Search subjects..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<span className="icon-with-text"><FiSearch className="h-4 w-4" /></span>}
          classNames={{
            inputWrapper: 'card-flat',
          }}
          className="w-full sm:w-64"
        />
      </div>

      {/* Year Tabs */}
      <Tabs
        selectedKey={selectedYear}
        onSelectionChange={(key) => setSelectedYear(key as string)}
        variant="underlined"
        className="w-full"
        classNames={{
          tabList: 'gap-2 overflow-x-auto sm:gap-4',
          tab: 'h-10',
          cursor: 'bg-primary',
        }}
      >
        <Tab key="all" title="All" />
        <Tab key="1" title="Year 1" />
        <Tab key="2" title="Year 2" />
        <Tab key="3" title="Year 3" />
      </Tabs>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="card-flat">
              <CardBody className="gap-3 p-4">
                <Skeleton className="h-36 w-full rounded-[var(--radius-lg)]" />
                <Skeleton className="h-4 w-1/4 rounded-lg" />
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      ) : (
        <Card className="card-flat">
          <CardBody className="text-center py-16">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-default-100">
              <FiBook className="text-default-400 text-xl" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No Subjects Found</h3>
            <p className="text-default-500">
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
