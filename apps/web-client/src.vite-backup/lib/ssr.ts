/**
 * SSR utilities for the web-client
 * These utilities help manage server-side rendering concerns
 */

/**
 * Get the initial data from window.__INITIAL_DATA__
 * This is populated by the server during SSR
 */
export function getInitialData<T = unknown>(key: string): T | undefined {
  if (typeof window === 'undefined') return undefined;

  const initialData = (window as unknown as { __INITIAL_DATA__?: Record<string, unknown> })
    .__INITIAL_DATA__;

  return initialData?.[key] as T | undefined;
}

/**
 * Clear the initial data after hydration
 * Call this after you've consumed the initial data to prevent memory leaks
 */
export function clearInitialData(key?: string): void {
  if (typeof window === 'undefined') return;

  const win = window as unknown as { __INITIAL_DATA__?: Record<string, unknown> };

  if (key) {
    delete win.__INITIAL_DATA__?.[key];
  } else {
    delete win.__INITIAL_DATA__;
  }
}

/**
 * Set initial data on the window (used by hydration script)
 */
export function setInitialData(data: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  (window as unknown as { __INITIAL_DATA__: Record<string, unknown> }).__INITIAL_DATA__ =
    data;
}

/**
 * Check if the code is running on the server
 */
export const isServer = typeof window === 'undefined';

/**
 * Check if the code is running on the client
 */
export const isClient = typeof window !== 'undefined';

/**
 * Safe localStorage access - returns undefined on server
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (isServer) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (isServer) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore errors (e.g., private browsing mode)
    }
  },
  removeItem: (key: string): void => {
    if (isServer) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};

/**
 * Safe sessionStorage access - returns undefined on server
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (isServer) return null;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (isServer) return;
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Ignore errors
    }
  },
  removeItem: (key: string): void => {
    if (isServer) return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};
