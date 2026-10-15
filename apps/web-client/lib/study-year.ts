'use client';

/**
 * The year a student is studying — drives "Your Year N subjects" on Today, the
 * default Subjects filter and "My year only" in search. It is the profile's
 * year_level (derived from the student email); the Subjects page has its own
 * year switch for browsing other years.
 */

import { useAuthStore } from '@/stores/auth.store';

/** The profile year, or null when unknown. */
export function useStudyYear(): { year: number | null } {
  const year = useAuthStore((state) => state.profile?.year_level ?? null);
  return { year };
}
