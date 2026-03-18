'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@nextui-org/react';
import { FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
import { api } from '@/lib/api';

const SAFE_EXACT_PATHS = new Set([
  '/',
  '/subjects',
  '/calendar',
  '/profile',
  '/acdm',
  '/learning-hub',
  '/about-me',
]);

function sanitizeTargetPath(path: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return '/';
  }

  if (SAFE_EXACT_PATHS.has(path)) {
    return path;
  }

  if (path.startsWith('/subjects/')) {
    return path;
  }

  return '/';
}

function AuthSyncContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const hasStartedSync = useRef(false);
  const isHandlingAuthFailure = useRef(false);
  const [syncError, setSyncError] = useState<'network_unreachable' | null>(null);

  const handleRetry = () => {
    hasStartedSync.current = false;
    setSyncError(null);
  };

  const handleAuthFailure = useCallback(async (errorCode: 'session_expired' | 'domain_restricted' = 'session_expired') => {
    if (isHandlingAuthFailure.current) {
      return;
    }

    isHandlingAuthFailure.current = true;

    try {
      await api.auth.logout();
    } catch {
      // Ignore logout failure during forced recovery.
    }

    try {
      await signOut({ redirect: false });
    } catch {
      // Ignore sign-out failures and continue redirect.
    }

    try {
      sessionStorage.setItem('auth_error', errorCode);
    } catch {
      // Ignore storage failures.
    }

    router.replace(`/login?error=${errorCode}`);
  }, [router]);

  useEffect(() => {
    const syncBackendSession = async () => {
      if (syncError) {
        return;
      }

      if (status !== 'authenticated') {
        if (status === 'unauthenticated') {
          router.replace('/login');
        }
        return;
      }

      const idToken = session?.idToken;
      if (!idToken) {
        await handleAuthFailure('domain_restricted');
        return;
      }

      if (hasStartedSync.current) {
        return;
      }

      hasStartedSync.current = true;

      try {
        await api.auth.verify(idToken);

        const to = sanitizeTargetPath(searchParams.get('to'));
        router.replace(to);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status;
          const backendError = String(
            error.response?.data?.error?.message ||
            error.response?.data?.message ||
            ''
          ).toLowerCase();

          // Unauthorized or invalid verification state should auto-clear and redirect.
          if (statusCode && statusCode >= 400 && statusCode < 500) {
            const isDomainRestricted = backendError.includes('domain') || backendError.includes('email');
            await handleAuthFailure(isDomainRestricted ? 'domain_restricted' : 'session_expired');
            return;
          }
        }

        // Network/unreachable/server-side failures should allow a single retry action.
        hasStartedSync.current = false;
        setSyncError('network_unreachable');
      }
    };

    void syncBackendSession();
  }, [status, session, router, searchParams, syncError, handleAuthFailure]);

  if (syncError) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-glass-canvas p-3 sm:p-4">
        <div className="glass-orb-a pointer-events-none left-[-6%] top-[-10%]" />
        <div className="glass-orb-b pointer-events-none bottom-[-12%] right-[-4%]" />
        <div className="glass-card w-full max-w-lg space-y-4 rounded-2xl p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--ink-1)]">We couldn&apos;t reach the server.</h2>
          <div className="flex">
            <Button
              color="primary"
              className="btn-precise w-full justify-center"
              startContent={<span className="icon-with-text"><FiRefreshCw className="h-4 w-4" /></span>}
              onPress={handleRetry}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-glass-canvas">
      <div className="glass-orb-a pointer-events-none left-[-6%] top-[-10%]" />
      <div className="glass-orb-b pointer-events-none bottom-[-12%] right-[-4%]" />
      <div className="glass-card rounded-2xl px-8 py-6 text-center">
        <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600" />
        <p className="text-sm font-medium text-[var(--ink-2)]">Checking your session...</p>
      </div>
    </div>
  );
}

export default function AuthSyncPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-glass-canvas">
          <div className="glass-card rounded-2xl px-8 py-6 text-center">
            <p className="text-sm font-medium text-[var(--ink-2)]">Checking your session...</p>
          </div>
        </div>
      }
    >
      <AuthSyncContent />
    </Suspense>
  );
}
