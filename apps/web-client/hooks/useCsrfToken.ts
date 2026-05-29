'use client';

import { useSyncExternalStore } from 'react';
import { readCsrfToken } from '@/lib/api';

// The cookie is read on demand; there is no event to subscribe to, so the
// subscribe callback is a no-op.
const subscribe = () => () => {};

/**
 * Reads the non-httpOnly `_csrf` cookie. The shared axios instance (lib/api.ts)
 * already injects the header on every mutation, so most code never needs this —
 * it exists for components that issue requests outside the axios client.
 */
export function useCsrfToken(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readCsrfToken(),
    () => null,
  );
}
