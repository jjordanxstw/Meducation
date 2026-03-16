'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@nextui-org/react';
import { FiArrowLeft, FiRefreshCw, FiRotateCcw } from 'react-icons/fi';
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
  const [syncError, setSyncError] = useState<'missing_token' | 'sync_failed' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRetry = () => {
    hasStartedSync.current = false;
    setSyncError(null);
  };

  const handleBackToLogin = () => {
    const error = syncError || 'sync_failed';
    router.replace(`/login?error=${error}`);
  };

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
        setSyncError('missing_token');
        return;
      }

      if (hasStartedSync.current) {
        return;
      }

      hasStartedSync.current = true;
      setIsSyncing(true);

      try {
        await api.auth.verify(idToken);

        const to = sanitizeTargetPath(searchParams.get('to'));
        router.replace(to);
      } catch {
        setSyncError('sync_failed');
      } finally {
        setIsSyncing(false);
      }
    };

    void syncBackendSession();
  }, [status, session, router, searchParams, syncError]);

  if (syncError) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-glass-canvas p-3 sm:p-4">
        <div className="glass-orb-a pointer-events-none left-[-6%] top-[-10%]" />
        <div className="glass-orb-b pointer-events-none bottom-[-12%] right-[-4%]" />
        <div className="glass-card w-full max-w-lg space-y-4 rounded-2xl p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--ink-1)]">Session setup failed</h2>
          <p className="text-sm text-[var(--ink-2)]">
            {syncError === 'missing_token'
              ? 'Google sign-in response did not include a usable id token.'
              : 'Unable to sync your backend session. Please retry sign-in.'}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              color="primary"
              className="btn-precise w-full justify-center sm:w-auto"
              startContent={<span className="icon-with-text"><FiRefreshCw className="h-4 w-4" /></span>}
              onPress={handleRetry}
            >
              Retry
            </Button>
            <Button
              variant="flat"
              className="btn-precise w-full justify-center sm:w-auto"
              startContent={<span className="icon-with-text"><FiArrowLeft className="h-4 w-4" /></span>}
              onPress={handleBackToLogin}
            >
              Back to Login
            </Button>
            <Button
              variant="light"
              className="btn-precise w-full justify-center sm:w-auto"
              startContent={<span className="icon-with-text"><FiRotateCcw className="h-4 w-4" /></span>}
              onPress={async () => signOut({ callbackUrl: '/login' })}
            >
              Reset Auth
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
        <p className="text-sm font-medium text-[var(--ink-2)]">
          {isSyncing ? 'Preparing your session...' : 'Waiting for authentication...'}
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
            <p className="text-sm font-medium text-[var(--ink-2)]">Preparing your session...</p>
          </div>
        </div>
      }
    >
      <AuthSyncContent />
    </Suspense>
  );
}
