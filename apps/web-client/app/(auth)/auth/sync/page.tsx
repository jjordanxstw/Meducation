'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@heroui/react';
import { FiRefreshCw, FiBook, FiAlertCircle } from 'react-icons/fi';
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
  '/about-us',
]);

const SAFE_PREFIX_PATHS = ['/subjects/'];

/**
 * Restricts the post-login `to` parameter to known internal dashboard
 * routes. We deliberately reject any input that:
 *  - is empty/null
 *  - does not begin with a single forward slash (rejects http://, //evil)
 *  - contains backslashes or control characters
 *  - resolves to a path outside of {@link SAFE_EXACT_PATHS} / SAFE_PREFIX_PATHS
 *
 * This prevents open-redirect abuse where an attacker could craft a link
 * like `/login?to=//evil.com` to bounce a freshly authenticated user off
 * to an arbitrary domain.
 */
function sanitizeTargetPath(path: string | null): string {
  if (!path) {
    return '/';
  }

  if (!path.startsWith('/') || path.startsWith('//')) {
    return '/';
  }

  if (path.includes('\\') || /[\u0000-\u001f\u007f]/.test(path)) {
    return '/';
  }

  // Drop any query string before evaluating against the allowlist; we still
  // pass the original path forward to preserve any legitimate query params.
  const [pathOnly] = path.split('?');

  if (SAFE_EXACT_PATHS.has(pathOnly)) {
    return path;
  }

  if (SAFE_PREFIX_PATHS.some((prefix) => pathOnly.startsWith(prefix))) {
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
  const [stepIndex, setStepIndex] = useState(0);

  const syncSteps = [
    'Verifying identity...',
    'Syncing your profile...',
    'Almost there...',
  ];

  // Cycle the reassuring progress copy while the backend session is established.
  useEffect(() => {
    if (syncError) {
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % syncSteps.length);
    }, 1500);
    return () => clearInterval(interval);
    // syncSteps is a stable literal; only re-run when the error state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncError]);

  const handleRetry = () => {
    hasStartedSync.current = false;
    setStepIndex(0);
    setSyncError(null);
  };

  const handleBackToLogin = () => {
    router.replace('/login');
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
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15">
            <FiAlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-[var(--ink-1)]">Connection failed</h2>
            <p className="text-sm text-[var(--ink-2)]">
              We couldn&apos;t reach the server. Check your internet connection and try again.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              color="primary"
              className="btn-precise w-full justify-center"
              startContent={<span className="icon-with-text"><FiRefreshCw className="h-4 w-4" /></span>}
              onPress={handleRetry}
            >
              Try Again
            </Button>
            <Button
              variant="light"
              className="btn-precise w-full justify-center text-[var(--ink-2)]"
              onPress={handleBackToLogin}
            >
              Back to Login
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
      <div className="glass-card rounded-2xl px-10 py-8 text-center">
        {/* Animated logo with pulse ring */}
        <div className="relative mx-auto mb-5 flex h-12 w-12 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-20" />
          <FiBook className="relative h-12 w-12 text-blue-500" />
        </div>
        <p className="text-sm font-medium text-[var(--ink-2)] transition-opacity duration-300">
          {syncSteps[stepIndex]}
        </p>
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
