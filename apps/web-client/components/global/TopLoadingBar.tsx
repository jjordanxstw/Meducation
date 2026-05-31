'use client';

import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export function TopLoadingBar() {
  const fetchingCount = useIsFetching();
  const mutatingCount = useIsMutating();
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const currentPath = useMemo(() => {
    if (typeof window === 'undefined') {
      return pathname;
    }

    return `${pathname}${window.location.search}`;
  }, [pathname]);

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
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (nextPath === currentPath) {
        return;
      }

      setPendingPath(nextPath);
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  const isRouteNavigating = pendingPath !== null && pendingPath !== currentPath;
  const isBusy = fetchingCount + mutatingCount > 0 || isRouteNavigating;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5 overflow-hidden transition-opacity duration-200 ${
        isBusy ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="h-full w-full animate-top-loading bg-gradient-to-r from-transparent via-brand to-transparent" />
    </div>
  );
}
