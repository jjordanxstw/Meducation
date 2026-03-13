import { useMemo } from 'react';

/**
 * SSR detection hook
 * Returns whether code is running on server or client
 */
export function useSSR() {
  return useMemo(
    () => ({
      isServer: typeof window === 'undefined',
      isClient: typeof window !== 'undefined',
    }),
    [],
  );
}

/**
 * Helper to check if we're on the server
 * Can be used outside of components
 */
export const isServer = typeof window === 'undefined';

/**
 * Helper to check if we're on the client
 * Can be used outside of components
 */
export const isClient = typeof window !== 'undefined';
