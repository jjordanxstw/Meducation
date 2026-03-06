/**
 * Subjects Page - List all subjects
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Input, Skeleton, Button } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';
import { FiSearch, FiBook } from 'react-icons/fi';
import type { Subject } from '@medical-portal/shared';

const yearTabs = [
  { key: 'all', label: 'All' },
  { key: '1', label: 'Year 1' },
  { key: '2', label: 'Year 2' },
  { key: '3', label: 'Year 3' },
];

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
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-medical-gray-900 mb-1 sm:mb-2">
            All Subjects
          </h1>
          <p className="text-medical-gray-500 text-base sm:text-lg">
            Select subjects you want to study
          </p>
        </div>

        <Input
          placeholder="Search subjects..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<FiSearch className="text-medical-gray-400 w-4 h-4" />}
          className="w-full sm:w-64 lg:w-80"
          size="md"
          classNames={{
            inputWrapper: 'bg-white shadow-md border-medical-gray-200 rounded-xl h-11 sm:h-12',
            input: 'text-sm sm:text-base',
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        {yearTabs.map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={selectedYear === tab.key ? 'solid' : 'flat'}
            color={selectedYear === tab.key ? 'primary' : 'default'}
            onPress={() => setSelectedYear(tab.key)}
            className={`font-semibold rounded-xl transition-all text-xs sm:text-sm px-3 sm:px-4 ${
              selectedYear === tab.key
                ? 'shadow-md'
                : 'bg-medical-gray-100 text-medical-gray-600 hover:bg-medical-gray-200'
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardBody className="p-4">
                <Skeleton className="h-32 rounded-lg" />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredSubjects.map((subject, index) => (
            <Card
              key={subject.id}
              isPressable
              as={Link}
              to={`/subjects/${subject.id}`}
              className="card-rounded shadow-card-hover hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardBody className="p-0">
                <div className="relative overflow-hidden">
                  <SubjectThumbnail src={subject.thumbnail_url} alt={subject.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 sm:px-2.5 py-1 rounded-lg">
                      {subject.code}
                    </span>
                    <span className="text-xs text-medical-gray-400 font-medium">
                      Year {subject.year_level}
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-sm sm:text-base text-medical-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-medical-gray-500 line-clamp-2 leading-relaxed">
                    {subject.description || 'No description'}
                  </p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-medical-gray-50 to-medical-gray-100 border-2 border-dashed border-medical-gray-300">
          <CardBody className="p-8 sm:p-12 md:p-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-medical-gray-200 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <FiBook className="w-8 h-8 sm:w-10 sm:h-10 text-medical-gray-400" />
            </div>
            <h3 className="font-heading text-lg sm:text-xl font-semibold text-medical-gray-700 mb-2 sm:mb-3">
              No Subjects Found
            </h3>
            <p className="text-medical-gray-500 text-base sm:text-lg">
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

function SubjectThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-40 gradient-medical-light flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
        <FiBook className="w-14 h-14 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="w-full h-40 overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
