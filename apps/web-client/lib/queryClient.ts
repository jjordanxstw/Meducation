import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: (failureCount, error: unknown) => {
          const responseStatus = axios.isAxiosError(error) ? error.response?.status : undefined;

          // Avoid retry loops for auth failures and canceled requests.
          if (responseStatus === 401 || error instanceof axios.CanceledError) {
            return false;
          }

          return failureCount < 1;
        },
      },
    },
  });
}
