import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { CalendarEvent } from '@medical-portal/shared';

export type UpcomingEvent = CalendarEvent & { subjects?: { name: string; code: string } | null };

/** Next calendar events from today onward, soonest first (Today page). */
export function useUpcomingEvents(limit = 20) {
  return useQuery({
    queryKey: queryKeys.calendar.upcoming(limit),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get('/calendar/upcoming', { params: { limit }, signal });
      return (res.data?.data ?? []) as UpcomingEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Most recent past events, newest first (Today tops up "Coming up" with these). */
export function useRecentEvents(limit = 4, enabled = true) {
  return useQuery({
    enabled,
    queryKey: queryKeys.calendar.recent(limit),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get('/calendar/recent', { params: { limit }, signal });
      return (res.data?.data ?? []) as UpcomingEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Whole days from today (local) to an ISO date; 0 = today. */
export function daysUntil(isoDate: string, now = new Date()): number {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  const target = new Date(y, (m ?? 1) - 1, d ?? 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
