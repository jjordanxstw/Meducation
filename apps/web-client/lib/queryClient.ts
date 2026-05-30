import { QueryClient, QueryCache, MutationCache, type Query } from '@tanstack/react-query';
import axios from 'axios';
import { notify } from './notify';

function statusOf(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

function handleGlobalError(error: unknown) {
  if (typeof window === 'undefined') return;
  const status = statusOf(error);
  // 401 redirects are primarily handled by the axios interceptor; 403 has no
  // other handler, so route it to the forbidden page here.
  if (status === 403 && !window.location.pathname.endsWith('/forbidden')) {
    const seg = window.location.pathname.split('/').filter(Boolean)[0];
    const localePrefix = seg === 'en' || seg === 'th' ? `/${seg}` : '';
    window.location.href = `${localePrefix}/forbidden`;
  }
}

function handleQueryError(error: unknown, query: Query<unknown, unknown, unknown, readonly unknown[]>) {
  handleGlobalError(error);

  // Only surface a toast for *background refetch* failures — i.e. the query
  // already has cached data we are still showing. Initial-load failures are
  // handled by each screen's own error UI, so we stay quiet there.
  if (
    typeof window !== 'undefined' &&
    query.state.data !== undefined &&
    !(error instanceof axios.CanceledError)
  ) {
    notify.error('Failed to refresh data — showing cached version');
  }
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleQueryError }),
    mutationCache: new MutationCache({ onError: handleGlobalError }),
    defaultOptions: {
      queries: {
        // Subject/lecture data changes infrequently.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false, // calmer study experience
        refetchOnReconnect: true, // but do refresh after coming back online
        retry: (failureCount, error: unknown) => {
          const status = statusOf(error);
          if (
            status === 401 ||
            status === 403 ||
            status === 404 ||
            error instanceof axios.CanceledError
          ) {
            return false; // never retry auth/permission/not-found/cancelled
          }
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
      },
      mutations: {
        retry: 0, // never retry mutations
      },
    },
  });
}
