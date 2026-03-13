/**
 * Query Client factory
 * Creates a configured QueryClient instance
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create a new QueryClient instance with default configuration
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
