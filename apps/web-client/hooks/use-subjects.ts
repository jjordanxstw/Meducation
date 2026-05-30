import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryFunctionContext } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Subject, SubjectWithSections } from '@medical-portal/shared';

type SubjectFilters = { yearLevel?: number | string };

// Single source of truth for fetching a subject's full hierarchy so the list
// hook, detail hook, and hover-prefetch all share an identical cache entry.
async function fetchSubjectDetail(
  id: string,
  { signal }: Pick<QueryFunctionContext, 'signal'>,
): Promise<SubjectWithSections | null> {
  const res = await apiClient.get(`/subjects/${id}`, { signal });
  return (res.data?.data ?? null) as SubjectWithSections | null;
}

export function useSubjects(filters: SubjectFilters) {
  const yearLevel = filters.yearLevel;
  return useQuery({
    queryKey: queryKeys.subjects.list({ yearLevel }),
    queryFn: async ({ signal }) => {
      const useYear = yearLevel !== undefined && yearLevel !== 'all';
      const res = await apiClient.get('/subjects', {
        params: useYear ? { year_level: Number(yearLevel) } : undefined,
        signal,
      });
      return (res.data?.data ?? []) as Subject[];
    },
  });
}

export function useSubjectDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.subjects.detail(id),
    enabled: !!id,
    queryFn: (context) => fetchSubjectDetail(id, context),
  });
}

/**
 * Returns a function that warms the cache for a subject's detail page. React
 * Query only fetches when the entry is missing/stale, so repeated hovers are
 * cheap and never duplicate an in-flight request.
 */
export function usePrefetchSubject() {
  const queryClient = useQueryClient();
  return (id: string) =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.subjects.detail(id),
      queryFn: (context) => fetchSubjectDetail(id, context),
    });
}
