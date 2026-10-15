'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';

const SAFE_EXACT_PATHS = new Set([
  '/',
  '/subjects',
  '/calendar',
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

  const syncSteps = ['Verifying your account', 'Syncing your profile', 'Opening MedPi'];

  // Cycle the reassuring progress copy while the backend session is established.
  useEffect(() => {
    if (syncError) {
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, syncSteps.length - 1));
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-3 sm:p-4">
        <div className="w-full max-w-md space-y-5 rounded-3xl border border-red-200 bg-white p-6 text-center shadow-xl shadow-red-500/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-ink-1">Connection failed</h2>
            <p className="text-sm text-ink-3">
              We couldn&apos;t reach the server. Check your internet connection and try again.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="w-full" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="ghost" className="w-full text-slate-600" onClick={handleBackToLogin}>
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm text-center" role="status" aria-live="polite">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle">
          <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink-1">Signing you in…</h1>
        <p className="mt-1 text-sm text-ink-2 tabular">
          {syncSteps[stepIndex]} · step {stepIndex + 1} of {syncSteps.length}
        </p>
        <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${((stepIndex + 1) / syncSteps.length) * 100}%` }} />
        </div>
        <p className="mt-4 text-xs text-ink-3">The first sign-in of the day can take up to 30 s while the server wakes up.</p>
      </div>
    </div>
  );
}

export default function AuthSyncPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas">
          <div className="rounded-3xl border border-slate-200/70 bg-white px-8 py-6 text-center shadow-lift">
            <p className="text-sm font-medium text-ink-3">Checking your session...</p>
          </div>
        </div>
      }
    >
      <AuthSyncContent />
    </Suspense>
  );
}
