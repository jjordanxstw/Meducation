import { useCallback, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type AnnouncementData = {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
};

const PAGE_SIZE = 10;

/**
 * Paginated announcements via infinite query. The backend uses page/pageSize
 * offset pagination, so we infer `hasNextPage` from whether the last page came
 * back full.
 */
export function useAnnouncements(pageSize = PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: queryKeys.announcements.infinite(),
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const res = await apiClient.get('/announcements', {
        params: { page: pageParam, pageSize },
        signal,
      });
      const items = (res.data?.data ?? []) as AnnouncementData[];
      return { items, page: pageParam as number };
    },
    getNextPageParam: (lastPage) =>
      lastPage.items.length === pageSize ? lastPage.page + 1 : undefined,
  });
}

const SEEN_KEY = 'med:seen_announcements';

function readSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/**
 * Tracks which announcements the user has already opened, persisted in
 * localStorage so the "new" indicator (C.1) clears once read.
 */
export function useAnnouncementsSeen() {
  const [seen, setSeen] = useState<Set<string>>(() => readSeen());

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
      } catch {
        /* storage unavailable — best-effort only */
      }
      return next;
    });
  }, []);

  const isSeen = useCallback((id: string) => seen.has(id), [seen]);

  return { isSeen, markSeen };
}
