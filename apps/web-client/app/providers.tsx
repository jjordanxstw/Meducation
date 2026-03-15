'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { NextUIProvider } from '@nextui-org/react';
import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createQueryClient } from '../lib/queryClient';
import { useAuthStore } from '@/stores/auth.store';

function AuthStoreBridge({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const initializedForCurrentSession = useRef(false);
  const { status } = useSession();
  const initializeFromServer = useAuthStore((state) => state.initializeFromServer);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    const isAuthPath = pathname === '/login' || pathname.startsWith('/auth/');

    if (status === 'authenticated' && !isAuthPath && !initializedForCurrentSession.current) {
      initializedForCurrentSession.current = true;
      void initializeFromServer();
    }

    if (status === 'unauthenticated') {
      initializedForCurrentSession.current = false;
      clearAuth();
    }
  }, [status, pathname, initializeFromServer, clearAuth]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  // Use useState to avoid recreating QueryClient on every render
  const [queryClient] = useState(() => createQueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <NextUIProvider>
          <AuthStoreBridge>{children}</AuthStoreBridge>
        </NextUIProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
