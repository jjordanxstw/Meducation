import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { LearningResource } from '@medical-portal/shared';

/**
 * Published "Learning Hub" cards for the student portal, ordered by the admin's
 * order_index then newest first. Each card carries its inline `technologies`
 * tags and `categories` (each with a set of external links).
 */
export function useLearningResources(pageSize = 60) {
  return useQuery({
    queryKey: queryKeys.learningHub.list({ pageSize }),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get('/learning-hub', { params: { pageSize }, signal });
      return (res.data?.data ?? []) as LearningResource[];
    },
  });
}

/**
 * A single published Learning Hub card for the detail page.
 */
export function useLearningResource(id: string) {
  return useQuery({
    queryKey: queryKeys.learningHub.detail(id),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get(`/learning-hub/${id}`, { signal });
      return res.data?.data as LearningResource;
    },
    enabled: Boolean(id),
  });
}
