'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

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

  useEffect(() => {
    const syncBackendSession = async () => {
      if (status !== 'authenticated') {
        if (status === 'unauthenticated') {
          router.replace('/login');
        }
        return;
      }

      const idToken = session?.idToken;
      if (!idToken) {
        await signOut({ callbackUrl: '/login?error=missing_token' });
        return;
      }

      if (hasStartedSync.current) {
        return;
      }
      hasStartedSync.current = true;

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
        await signOut({ callbackUrl: '/login?error=sync_failed' });
      }
    };

    void syncBackendSession();
  }, [status, session, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-glass-canvas">
      <div className="glass-card rounded-2xl px-8 py-6 text-center shadow-xl">
        <p className="text-sm font-medium text-slate-700">Preparing your session...</p>
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
