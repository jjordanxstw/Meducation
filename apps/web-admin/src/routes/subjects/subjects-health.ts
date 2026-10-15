import { useMemo } from 'react';
import { useApiUrl, useCustom } from '@refinedev/core';

export type SubjectHealth = {
  id: string;
  code: string;
  name: string;
  year_level: number;
  is_active: boolean;
  order_index: number;
  sections_count: number;
  lectures_count: number;
  empty_lectures_count: number;
  content_updated_at: string;
};

export function useSubjectsHealth() {
  const apiUrl = useApiUrl();
  const query = useCustom<{ data: SubjectHealth[] }>({
    url: `${apiUrl}/admin/statistics/subjects-health`,
    method: 'get',
    queryOptions: { queryKey: ['subjects-health'] },
  });
  const subjects = useMemo(() => (query.data?.data as unknown as { data?: SubjectHealth[] })?.data ?? [], [query.data]);
  return { subjects, isLoading: query.isLoading, refetch: query.refetch };
}

/** Next order_index within a year, so new subjects land at the end. */
export function nextOrderIndexFor(subjects: SubjectHealth[]) {
  return (year: number) =>
    subjects.filter((subject) => subject.year_level === year).reduce((max, subject) => Math.max(max, subject.order_index + 1), 0);
}
