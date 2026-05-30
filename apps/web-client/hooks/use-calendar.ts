import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { CalendarEvent } from '@medical-portal/shared';

type CalendarEventWithSubject = CalendarEvent & {
  subjects?: { name: string; code: string };
};

/**
 * Fetches calendar events for a month, keyed by the `YYYY-MM` string so
 * navigating back to a previously-viewed month is served from cache. The query
 * window is padded by ±1 month so adjacent-month days render without a flash.
 */
export function useCalendarEvents(month: string) {
  return useQuery({
    queryKey: queryKeys.calendar.events(month),
    queryFn: async ({ signal }) => {
      const base = dayjs(`${month}-01`);
      const params = {
        start_date: base.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
        end_date: base.add(1, 'month').endOf('month').format('YYYY-MM-DD'),
      };
      const res = await apiClient.get('/calendar', { params, signal });
      return (res.data?.data ?? []) as CalendarEventWithSubject[];
    },
  });
}
