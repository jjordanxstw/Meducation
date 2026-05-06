'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { NextUIProvider } from '@nextui-org/react';
import { SessionProvider } from 'next-auth/react';
import { ConfigProvider as AntdConfigProvider, theme as antdTheme } from 'antd';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof document === 'undefined') {
      return 'light';
    }

    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const applyTheme = useCallback((nextTheme: AppTheme) => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(nextTheme);
    root.dataset.theme = nextTheme;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('med:theme', nextTheme);
    }
  }, []);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    setThemeState((previousTheme) => {
      const nextTheme = previousTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, [applyTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isReady: true,
    }),
    [theme, setTheme, toggleTheme],
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

/** Reads theme from ThemeContext and provides antd ConfigProvider with matching algorithm */
function AntdThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = useAppTheme();

  return (
    <AntdConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#0070F3',
          fontFamily: 'var(--font-prompt), Prompt, sans-serif',
          borderRadius: 12,
        },
      }}
    >
      {children}
    </AntdConfigProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  // Use useState to avoid recreating QueryClient on every render
  const [queryClient] = useState(() => createQueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AntdThemeProvider>
            <NextUIProvider>
              <TopLoadingBar />
              <AuthStoreBridge>{children}</AuthStoreBridge>
            </NextUIProvider>
          </AntdThemeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
