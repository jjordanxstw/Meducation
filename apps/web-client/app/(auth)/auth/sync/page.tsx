'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@nextui-org/react';

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
        const response = await fetch('/api/v1/auth/verify', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          throw new Error('Failed to sync backend session');
        }

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
      <div className="flex min-h-screen items-center justify-center bg-glass-canvas p-4">
        <div className="glass-card w-full max-w-lg space-y-4 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-900">Session setup failed</h2>
          <p className="text-sm text-slate-600">
            {syncError === 'missing_token'
              ? 'Google sign-in response did not include a usable id token.'
              : 'Unable to sync your backend session. Please retry sign-in.'}
          </p>
          <div className="flex gap-3">
            <Button color="primary" onPress={handleRetry}>
              Retry
            </Button>
            <Button variant="flat" onPress={handleBackToLogin}>
              Back to Login
            </Button>
            <Button
              variant="light"
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
    <div className="flex min-h-screen items-center justify-center bg-glass-canvas">
      <div className="glass-card rounded-2xl px-8 py-6 text-center shadow-xl">
        <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600" />
        <p className="text-sm font-medium text-slate-700">
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
        <div className="flex min-h-screen items-center justify-center bg-glass-canvas">
          <div className="glass-card rounded-2xl px-8 py-6 text-center shadow-xl">
            <p className="text-sm font-medium text-slate-700">Preparing your session...</p>
          </div>
        </div>
      }
    >
      <AuthSyncContent />
    </Suspense>
  );
}
