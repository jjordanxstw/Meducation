'use client';

/**
 * "Recently opened" shortcuts — a per-browser list of the last lectures a
 * student opened, shown in the sidebar and as the "Continue" card on Today.
 *
 * Deliberately browser-only (localStorage): MedPi is a resource library, not a
 * course, so there is no server-side progress tracking and no schema for it.
 * Clearing site data simply empties the list.
 */

import { useSyncExternalStore } from 'react';

export type RecentLecture = {
  lectureId: string;
  subjectId: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  /** 1-based position of the lecture within its subject ("Lecture 7"). */
  lectureNumber?: number;
  openedAt: number;
};

const STORAGE_KEY = 'medpi:recently-opened';
const MAX_ITEMS = 8;
const EMPTY: RecentLecture[] = [];

const listeners = new Set<() => void>();
let cache: RecentLecture[] | null = null;

function read(): RecentLecture[] {
  if (cache) return cache;
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentLecture[]) : [];
    cache = Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: RecentLecture[]) {
  cache = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (private mode / quota) — keep the in-memory copy */
  }
  listeners.forEach((listener) => listener());
}

export function rememberLecture(entry: Omit<RecentLecture, 'openedAt'>) {
  const rest = read().filter((item) => item.lectureId !== entry.lectureId);
  write([{ ...entry, openedAt: Date.now() }, ...rest].slice(0, MAX_ITEMS));
}

export function forgetRecentlyOpened() {
  write([]);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Reactive list of recently opened lectures (empty during SSR). */
export function useRecentlyOpened(): RecentLecture[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
