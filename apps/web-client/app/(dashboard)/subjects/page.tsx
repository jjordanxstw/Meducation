'use client';

/**
 * Subjects Page - List all subjects
 * Next.js adapted version
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardBody,
  Input,
  Skeleton,
  Chip,
  Tabs,
  Tab,
} from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { FiSearch, FiBook } from 'react-icons/fi';
import type { Subject } from '@medical-portal/shared';
import Image from 'next/image';

function SubjectThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-40 w-full items-center justify-center bg-default-100">
        <FiBook className="text-default-400 text-4xl" />
      </div>
    );
  }

  return (
    <div className="relative h-40 w-full overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setFailed(true)}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">All Subjects</h1>
          <p className="text-default-500 text-base">Select subjects you want to study</p>
        </div>

        <Input
          placeholder="Search subjects..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<FiSearch />}
          classNames={{
            inputWrapper: 'bg-default-50',
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
            <Card key={i}>
              <CardBody className="gap-3 p-4">
                <Skeleton className="h-4 w-1/3 rounded-lg" />
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => (
            <Link key={subject.id} href={`/subjects/${subject.id}`}>
              <Card
                isPressable
                isBlurred
                className="h-full hover:scale-[1.02] transition-transform"
              >
                <CardBody className="p-0">
                  <SubjectThumbnail src={subject.thumbnail_url} alt={subject.name} />
                  <div className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Chip size="sm" color="primary" variant="flat">
                        {subject.code}
                      </Chip>
                      <Chip size="sm" variant="flat">
                        Year {subject.year_level}
                      </Chip>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-default-500 line-clamp-2">
                      {subject.description || 'No description'}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-default-100">
              <FiBook className="text-default-400 text-2xl" />
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
