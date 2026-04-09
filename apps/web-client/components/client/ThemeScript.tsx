'use client';

import { useEffect, useSyncExternalStore } from 'react';

/**
 * ThemeScript - Applies theme on initial mount to prevent flash
 * Uses useSyncExternalStore to run only on client
 */
export function ThemeScript() {
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!isClient) return;

    try {
      const stored = localStorage.getItem('med:theme');
      const theme = (stored === 'dark' || stored === 'light') ? stored : 'light';
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      root.dataset.theme = theme;
    } catch {
      document.documentElement.classList.add('light');
    }
  }, [isClient]);

  return null;
}
