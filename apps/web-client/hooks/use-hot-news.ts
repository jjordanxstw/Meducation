import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { News } from '@medical-portal/shared';

/**
 * Published "Hot News" articles for the home dashboard, newest first. Each item
 * carries its joined `category` (name + color) for rendering the colored tag.
 * The component picks the featured article as the hero and the rest as the grid.
 */
export function useHotNews(pageSize = 12) {
  return useQuery({
    queryKey: queryKeys.hotNews.list({ pageSize }),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get('/news', { params: { pageSize }, signal });
      return (res.data?.data ?? []) as News[];
    },
  });
}

/**
 * A single published article for the detail page.
 */
export function useNewsArticle(id: string) {
  return useQuery({
    queryKey: queryKeys.hotNews.detail(id),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get(`/news/${id}`, { signal });
      return res.data?.data as News;
    },
    enabled: Boolean(id),
  });
}
