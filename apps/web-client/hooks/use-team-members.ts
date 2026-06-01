import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { TeamMember } from '@medical-portal/shared';

/**
 * Fetches the active team members shown on the About Us page, ordered by the
 * admin-configured display order.
 */
export function useTeamMembers() {
  return useQuery({
    queryKey: queryKeys.teamMembers.all(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get('/team-members', { signal });
      return (res.data?.data ?? []) as TeamMember[];
    },
  });
}
