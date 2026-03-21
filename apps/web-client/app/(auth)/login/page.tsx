'use client';

/**
 * Login Page using NextAuth Google OAuth
 * Supports both light and dark themes
 */

import { useEffect, useRef, useState, useSyncExternalStore, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import {
  FiMoon,
  FiSun,
  FiLock,
  FiShield,
} from 'react-icons/fi';
import { useAppTheme } from '@/app/providers';

// Google SVG icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme, isReady } = useAppTheme();
  const authError = searchParams.get('error');
  const handledAuthErrorRef = useRef(false);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 p-3 dark:bg-[radial-gradient(ellipse_at_top,_#0d1b2e_0%,_#07131f_50%,_#050a12_100%)] sm:p-4">
      {/* Animated background orbs */}
      <div
        className="pointer-events-none absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-blue-500/5 blur-3xl dark:bg-blue-500/10"
        style={{ animation: 'pulse 6s ease-in-out infinite' }}
      />
      <div
        className="pointer-events-none absolute bottom-[15%] right-[8%] h-80 w-80 rounded-full bg-teal-500/4 blur-3xl dark:bg-teal-500/8"
        style={{ animation: 'pulse 8s ease-in-out infinite', animationDelay: '2s' }}
      />
      <div
        className="pointer-events-none absolute left-[50%] top-[60%] h-56 w-56 -translate-x-1/2 rounded-full bg-blue-400/3 blur-3xl dark:bg-blue-400/6"
        style={{ animation: 'pulse 7s ease-in-out infinite', animationDelay: '4s' }}
      />

      {/* Theme toggle button */}
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={toggleTheme}
        className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 backdrop-blur-sm transition-all hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white sm:right-5 sm:top-5"
      >
        {mounted && isReady && theme === 'dark' ? (
          <FiSun className="h-4 w-4" />
        ) : (
          <FiMoon className="h-4 w-4" />
        )}
      </button>

      {/* Main card */}
      <div className="relative w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1b2e]/90 dark:shadow-black/60">
        {/* Top shine line */}
        <div
          className="absolute left-0 right-0 top-0 h-px rounded-t-2xl"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)',
          }}
        />
        <div
          className="absolute left-0 right-0 top-0 hidden h-px rounded-t-2xl dark:block"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          }}
        />

        {/* Logo and Title */}
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-900/50 border border-blue-500/30 ring-4 ring-blue-500/10">
            <span className="text-xl font-bold text-white">L</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Learning Portal</h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-white/50">Secure sign-in for medical students</p>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
          <div className="flex items-start gap-3">
            <FiShield className="h-[18px] w-[18px] shrink-0 text-blue-600 mt-0.5 dark:text-blue-400" />
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">For Medical Students Only</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-white/50">
                Sign in with your @student.mahidol.edu Google account
              </p>
            </div>
          </div>
        </div>

        {/* Auth Error */}
        {authErrorMessage && (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-900/20 dark:text-red-200">
            {authErrorMessage}
          </div>
        )}

        {/* Divider */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
          <span className="text-xs text-slate-400 dark:text-white/30">sign in with</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleSignInClick}
          disabled={status === 'loading'}
          className="mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-md shadow-slate-200/50 transition-all duration-200 hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed dark:border-transparent dark:shadow-black/30 dark:hover:bg-gray-50"
        >
          {status === 'loading' ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <>
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </>
          )}
        </button>

        {/* Security Note */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <FiLock className="h-3 w-3 text-slate-400 dark:text-white/30" />
          <span className="text-xs text-slate-400 dark:text-white/30">Protected by NextAuth · Session verified</span>
        </div>
      </div>

      {/* CSS keyframes for pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.08;
          }
          50% {
            opacity: 0.15;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 p-3 dark:bg-[radial-gradient(ellipse_at_top,_#0d1b2e_0%,_#07131f_50%,_#050a12_100%)] sm:p-4">
          <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white/95 p-8 text-center shadow-xl dark:border-white/10 dark:bg-[#0d1b2e]/90">
            <p className="text-sm font-medium text-slate-500 dark:text-white/50">Loading sign-in screen...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
