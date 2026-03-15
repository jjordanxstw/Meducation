'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { NextUIProvider } from '@nextui-org/react';
import { SessionProvider } from 'next-auth/react';
import { ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createQueryClient } from '../lib/queryClient';
import { useAuthStore } from '@/stores/auth.store';
import { TopLoadingBar } from '@/components/global/TopLoadingBar';

type AppTheme = 'light' | 'dark';

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (nextTheme: AppTheme) => void;
  toggleTheme: () => void;
  isReady: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const rootTheme = root.classList.contains('dark') ? 'dark' : 'light';
    setThemeState(rootTheme);
    setIsReady(true);
  }, []);

  const setTheme = (nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(nextTheme);
    root.dataset.theme = nextTheme;
    localStorage.setItem('med:theme', nextTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isReady,
    }),
    [theme, isReady],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside Providers.');
  }

  return context;
}

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
        <ThemeProvider>
          <NextUIProvider>
            <TopLoadingBar />
            <AuthStoreBridge>{children}</AuthStoreBridge>
          </NextUIProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
