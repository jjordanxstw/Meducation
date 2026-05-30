'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { HeroUIProvider } from '@heroui/react';
import { SessionProvider } from 'next-auth/react';
import { ConfigProvider as AntdConfigProvider, theme as antdTheme } from 'antd';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createQueryClient } from '../lib/queryClient';
import { useAuthStore } from '@/stores/auth.store';
import { TopLoadingBar } from '@/components/global/TopLoadingBar';
import { HERO_TOKENS } from '@medical-portal/shared';

const tokens = HERO_TOKENS.light;

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

/** Static light Ant Design theme matching the shared HERO light tokens. */
function AntdThemeProvider({ children }: { children: ReactNode }) {
  return (
    <AntdConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: tokens.brand.primary,
          colorBgBase: tokens.bg.canvas,
          colorBgContainer: tokens.bg.surface,
          colorBgElevated: tokens.bg.surfaceElevated,
          colorBorder: tokens.border.default,
          colorBorderSecondary: tokens.border.subtle,
          colorTextBase: tokens.text.primary,
          colorText: tokens.text.primary,
          colorTextSecondary: tokens.text.secondary,
          colorTextTertiary: tokens.text.muted,
          colorLink: tokens.text.link,
          colorLinkHover: tokens.text.linkHover,
          colorSuccess: tokens.state.success.fg,
          colorWarning: tokens.state.warning.fg,
          colorError: tokens.state.danger.fg,
          colorInfo: tokens.state.info.fg,
          boxShadowSecondary: tokens.shadow.md,
          fontFamily: 'var(--font-noto-sans), "Noto Sans", sans-serif',
          borderRadius: 12,
        },
        components: {
          Calendar: {
            colorBgContainer: tokens.bg.surface,
          },
          DatePicker: {
            activeBorderColor: tokens.brand.primary,
            hoverBorderColor: tokens.brand.primaryHover,
          },
          Input: {
            activeBorderColor: tokens.brand.primary,
            hoverBorderColor: tokens.brand.primaryHover,
          },
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
        <AntdThemeProvider>
          <HeroUIProvider>
            <TopLoadingBar />
            <AuthStoreBridge>{children}</AuthStoreBridge>
          </HeroUIProvider>
        </AntdThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
