'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { NextUIProvider } from '@nextui-org/react';
import { ReactNode, useState, useEffect } from 'react';
import { createQueryClient } from '../lib/queryClient';
import { useAuthStore } from '@/stores/auth.store';

/**
 * AuthProvider - Initializes authentication state on mount
 * Uses httpOnly cookies for secure authentication
 */
function AuthProvider({ children }: { children: ReactNode }) {
  const initializeFromServer = useAuthStore((state) => state.initializeFromServer);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    // Only initialize once on mount
    if (!isInitialized) {
      initializeFromServer();
    }
  }, [isInitialized, initializeFromServer]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  // Use useState to avoid recreating QueryClient on every render
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NextUIProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </NextUIProvider>
    </QueryClientProvider>
  );
}
