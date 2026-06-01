/**
 * Centralized React Query key factory.
 *
 * Using a single source of truth for query keys avoids cache-invalidation bugs
 * caused by ad-hoc, slightly-different key arrays scattered across components.
 * Every key is `as const` so TypeScript preserves the literal tuple shape.
 */
export const queryKeys = {
  subjects: {
    all: () => ['subjects'] as const,
    list: (filters: { yearLevel?: number | string; search?: string }) =>
      ['subjects', 'list', filters] as const,
    detail: (id: string) => ['subjects', 'detail', id] as const,
    hierarchy: (id: string) => ['subjects', 'hierarchy', id] as const,
  },
  announcements: {
    all: () => ['announcements'] as const,
    list: (page: number) => ['announcements', 'list', page] as const,
    infinite: () => ['announcements', 'infinite'] as const,
  },
  calendar: {
    events: (month: string) => ['calendar', 'events', month] as const,
  },
  teamMembers: {
    all: () => ['teamMembers'] as const,
  },
  profile: {
    me: () => ['profile', 'me'] as const,
  },
  watermark: () => ['watermark'] as const,
} as const;
