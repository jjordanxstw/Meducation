import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import axios from 'axios';

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

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleGlobalError }),
    mutationCache: new MutationCache({ onError: handleGlobalError }),
    defaultOptions: {
      queries: {
        // Subject/lecture data changes infrequently.
        staleTime: 30_000,
        refetchOnWindowFocus: false, // calmer study experience
        retry: (failureCount, error: unknown) => {
          const status = statusOf(error);
          if (status === 401 || status === 403 || error instanceof axios.CanceledError) {
            return false; // never retry auth/permission errors
          }
          return failureCount < 2;
        },
      },
    },
  });
}
