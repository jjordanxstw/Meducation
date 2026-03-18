'use client';

/**
 * Login Page using NextAuth Google OAuth
 */

import { useEffect } from 'react';
import { useRef } from 'react';
import { useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import {
  Card,
  CardBody,
  Button,
  Divider,
} from '@nextui-org/react';
import { FcGoogle } from 'react-icons/fc';
import { FiMoon, FiSun } from 'react-icons/fi';
import { useAppTheme } from '@/app/providers';

function LoginContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme, isReady } = useAppTheme();
  const authError = searchParams.get('error');
  const handledAuthErrorRef = useRef(false);
  const [storedAuthError] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return sessionStorage.getItem('auth_error');
    } catch {
      return null;
    }
  });

  const authErrorMessageMap: Record<string, string> = {
    missing_token: 'Google sign-in completed but no id token was returned. Please sign in again.',
    sync_failed: 'Unable to establish backend session. Please try signing in again.',
    session_expired: 'Your session has expired. Please login again.',
    domain_restricted: 'Please sign in with an email ending in @mahidol.student.edu.',
    OAuthCallback: 'Google OAuth callback failed. Please retry sign-in.',
    AccessDenied: 'Access denied by Google or application policy.',
  };

  const effectiveAuthError = authError || storedAuthError;
  const authErrorMessage = effectiveAuthError
    ? authErrorMessageMap[effectiveAuthError] || 'Authentication failed. Please try again.'
    : null;

  useEffect(() => {
    // Keep users on the login page when an auth error is present,
    // so they can actually see the error message instead of being redirected.
    if (effectiveAuthError) {
      if (status === 'authenticated' && !handledAuthErrorRef.current) {
        handledAuthErrorRef.current = true;
        void signOut({ redirect: false });
      }
      return;
    }

    if (status === 'authenticated') {
      const to = searchParams.get('to') || '/';
      router.replace(`/auth/sync?to=${encodeURIComponent(to)}`);
    }
  }, [status, router, searchParams, effectiveAuthError]);

  const handleSignInClick = async () => {
    const to = searchParams.get('to') || '/';
    await signIn('google', { callbackUrl: `/auth/sync?to=${encodeURIComponent(to)}` });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-glass-canvas p-3 sm:p-4">
      <div className="glass-orb-a pointer-events-none left-[-8%] top-[-10%]" />
      <div className="glass-orb-b pointer-events-none bottom-[-15%] right-[-6%]" />

      <Button
        isIconOnly
        radius="full"
        variant="light"
        aria-label="Toggle theme"
        className="icon-circle-btn glass-soft absolute right-3 top-3 z-20 text-[var(--ink-1)] sm:right-5 sm:top-5"
        onPress={toggleTheme}
      >
        {isReady && theme === 'dark' ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
      </Button>

      <Card className="glass-card w-full max-w-[30rem] rounded-[var(--radius-xl)]">
        <CardBody className="gap-4 p-5 sm:gap-5 sm:p-8">
          {/* Logo and Title */}
          <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
            <div className="card-flat flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] text-lg font-bold text-primary bg-primary/10">
              {/* TODO: Replace with brand logo image provided by user */}
              L
            </div>
            <div>
              <h1 className="text-[clamp(1.75rem,5.4vw,2.25rem)] font-bold leading-tight text-[var(--ink-1)]">Learning Portal</h1>
              <p className="text-sm text-[var(--ink-2)] sm:text-base">Secure sign-in for medical students</p>
            </div>
          </div>

          <Divider />

          {/* Notice */}
          <div className="card-flat rounded-xl p-4">
            <div className="flex items-start gap-3 sm:items-center">
              <span className="shrink-0 text-2xl leading-none">📌</span>
              <div className="min-w-0 text-left">
                <p className="font-semibold text-primary">For Medical Students Only</p>
                <p className="text-sm text-default-500">
                  Sign in with your Google account
                </p>
              </div>
            </div>
          </div>

          {authErrorMessage && (
            <div className="rounded-xl border border-danger-200/70 bg-danger-100/60 px-4 py-3 text-sm text-danger-700 dark:border-danger-400/40 dark:bg-danger-900/20 dark:text-danger-200">
              {authErrorMessage}
            </div>
          )}

          <Button
            color="primary"
            variant="shadow"
            size="lg"
            startContent={<span className="icon-with-text"><FcGoogle className="h-5 w-5" /></span>}
            onPress={handleSignInClick}
            className="btn-precise w-full justify-center font-semibold"
            isLoading={status === 'loading'}
          >
            Continue with Google
          </Button>

          {/* Terms */}
          <p className="mx-auto max-w-[34ch] text-center text-xs text-[var(--ink-2)] sm:text-sm">
            Sign-in is protected by NextAuth and backend session verification.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-glass-canvas p-3 sm:p-4">
          <div className="glass-card w-full max-w-[30rem] rounded-2xl p-6 text-center sm:p-8">
            <p className="text-sm font-medium text-[var(--ink-2)]">Loading sign-in screen...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
