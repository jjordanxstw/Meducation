'use client';

import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function TopLoadingBar() {
  const fetchingCount = useIsFetching();
  const mutatingCount = useIsMutating();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Full committed URL, tracked reactively so search-param-only changes still
  // register as a navigation (a `pathname`-only memo would desync from these).
  const search = searchParams.toString();
  const currentPath = `${pathname}${search ? `?${search}` : ''}`;

  const [pendingPath, setPendingPath] = useState<string | null>(null);
  // Seed with the current URL so there's no render-phase state update on mount
  // (which would diverge from the server render and trip hydration).
  const [trackedPath, setTrackedPath] = useState<string>(currentPath);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Any committed navigation clears the pending state — this is what stops the
  // bar. Done with React's adjust-state-during-render pattern (no effect, no
  // stale comparison). A safety timeout in the click handler covers the case of
  // a click that never actually navigates.
  if (currentPath !== trackedPath) {
    setTrackedPath(currentPath);
    setPendingPath(null);
  }

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]');
      if (!anchor) {
        return;
      }

      if ((anchor as HTMLAnchorElement).target && (anchor as HTMLAnchorElement).target !== '_self') {
        return;
      }

      if (anchor.hasAttribute('download')) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) {
        return;
      }

      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) {
        return;
      }

      const nextPath = `${url.pathname}${url.search}`;
      const here = `${window.location.pathname}${window.location.search}`;
      if (nextPath === here) {
        return;
      }

      setPendingPath(nextPath);
      if (safetyTimer.current) {
        clearTimeout(safetyTimer.current);
      }
      safetyTimer.current = setTimeout(() => {
        setPendingPath(null);
        safetyTimer.current = null;
      }, 8000);
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      if (safetyTimer.current) {
        clearTimeout(safetyTimer.current);
        safetyTimer.current = null;
      }
    };
  }, []);

  const isBusy = fetchingCount + mutatingCount > 0 || pendingPath !== null;

  return (
    <div
      aria-hidden="true"
      suppressHydrationWarning
      className={`pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5 overflow-hidden transition-opacity duration-200 ${
        isBusy ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="h-full w-full animate-top-loading bg-gradient-to-r from-transparent via-brand to-transparent" />
    </div>
  );
}
