'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from '@/i18n/routing';

const SUBJECT_DETAIL_RE = /^\/subjects\/([^/]+)$/;

function subjectIdFromPath(path: string): string | null {
  const match = SUBJECT_DETAIL_RE.exec(path);
  return match ? match[1] : null;
}

/**
 * Resets scroll position to the top whenever the route changes.
 *
 * Exception: the subject detail page (`/subjects/[id]`) restores scroll to the
 * top on the first visit but preserves the previous scroll position when the
 * user navigates back to it, keyed per-subject in `sessionStorage`.
 */
export function ScrollRestoration() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Persist the scroll position of the page we are leaving so it can be
    // restored later (only meaningful for subject detail pages).
    const leavingId = previousPath.current
      ? subjectIdFromPath(previousPath.current)
      : null;
    if (leavingId) {
      try {
        sessionStorage.setItem(`scroll_${leavingId}`, String(window.scrollY));
      } catch {
        /* sessionStorage may be unavailable (private mode) — ignore */
      }
    }

    const enteringId = subjectIdFromPath(pathname);
    if (enteringId) {
      let stored: string | null = null;
      try {
        stored = sessionStorage.getItem(`scroll_${enteringId}`);
      } catch {
        stored = null;
      }
      if (stored !== null) {
        window.scrollTo({ top: Number(stored), behavior: 'instant' as ScrollBehavior });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }

    previousPath.current = pathname;
  }, [pathname]);

  return null;
}
