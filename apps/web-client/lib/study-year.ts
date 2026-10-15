'use client';

/**
 * The year a student is "studying" — drives "Your Year N subjects" on Today and
 * the default Subjects filter. Defaults to the profile's year_level; a student
 * repeating content or helping juniors can switch it from the sidebar. Stored
 * per browser (no schema change).
 */

import { useSyncExternalStore } from 'react';
import { useAuthStore } from '@/stores/auth.store';

const STORAGE_KEY = 'medpi:study-year';
const listeners = new Set<() => void>();

function readStored(): number | null {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    return value >= 1 && value <= 6 ? value : null;
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function setStudyYear(year: number | null) {
  try {
    if (year === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, String(year));
  } catch {
    /* storage unavailable — the choice lasts until reload */
  }
  listeners.forEach((listener) => listener());
}

/** The chosen study year, else the profile year, else null (unknown). */
export function useStudyYear(): { year: number | null; profileYear: number | null } {
  const stored = useSyncExternalStore(subscribe, readStored, () => null);
  const profileYear = useAuthStore((state) => state.profile?.year_level ?? null);
  return { year: stored ?? profileYear, profileYear };
}
