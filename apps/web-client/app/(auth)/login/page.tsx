'use client';

/**
 * Login Page using NextAuth Google OAuth.
 * English-only, single light theme.
 */

import { useEffect, useRef, useState, useSyncExternalStore, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FiLock, FiShield } from 'react-icons/fi';

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
  const [isRedirecting, setIsRedirecting] = useState(false);
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

  // storedAuthError comes from sessionStorage, which is unavailable during SSR.
  // Only factor it in after mount so the hydration render matches the server
  // (where it is always null) and avoids a text mismatch in the banner below.
  const effectiveAuthError = authError || (mounted ? storedAuthError : null);
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
    setIsRedirecting(true);
    await signIn('google', { callbackUrl: `/auth/sync?to=${encodeURIComponent(to)}` });
  };

  const isSigningIn = status === 'loading' || isRedirecting;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f8fe] p-3 sm:p-4">
      {/* Animated gradient orbs — atmospheric depth */}
      <div
        className="pointer-events-none absolute left-[-4rem] top-[-4rem] h-96 w-96 animate-float rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(47,128,237,0.14),transparent_70%)] blur-3xl"
      />
      <div
        className="pointer-events-none absolute bottom-[-5rem] right-[-4rem] h-96 w-96 animate-float rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(47,128,237,0.1),transparent_70%)] blur-3xl [animation-delay:3s]"
      />

      <div className="relative w-full max-w-[420px]">
      {/* Main card */}
      <div className="relative w-full rounded-3xl border border-slate-200/70 bg-white/95 p-8 shadow-lift backdrop-blur-xl">
        {/* Logo and Title */}
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand shadow-lg shadow-brand/30 ring-4 ring-brand/10">
            <span className="font-serif text-2xl font-semibold text-white">M</span>
          </div>
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">MedPi Portal</h1>
            <p className="mt-1.5 text-sm text-slate-500">Secure sign-in for medical students</p>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="mt-6 rounded-xl border border-brand/20 bg-brand-subtle px-4 py-3">
          <div className="flex items-start gap-3">
            <FiShield className="h-[18px] w-[18px] shrink-0 text-brand mt-0.5" />
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-brand">For Medical Students Only</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Sign in with your @student.mahidol.edu Google account
              </p>
            </div>
          </div>
        </div>

        {/* Auth Error */}
        {authErrorMessage && (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {authErrorMessage}
          </div>
        )}

        {/* Divider */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">sign in with</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleSignInClick}
          disabled={isSigningIn}
          className="mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-gray-800 shadow-md shadow-slate-200/50 transition-all duration-200 hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSigningIn ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
              {isRedirecting ? 'Redirecting…' : 'Continue with Google'}
            </>
          ) : (
            <>
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </>
          )}
        </button>

        {/* Security Note */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <FiLock className="h-3 w-3 text-slate-400" />
          <span className="text-xs text-slate-400">Protected by NextAuth · Session verified</span>
        </div>
      </div>

      {/* Accepted email domains notice */}
      <p className="mt-4 text-center text-xs text-slate-400">
        Only @student.mahidol.edu and @student.mahidol.ac.th email addresses are accepted.
      </p>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f8fe] p-3 sm:p-4">
          <div className="w-full max-w-[420px] rounded-2xl border border-slate-200/70 bg-white/95 p-8 text-center shadow-lift">
            <p className="text-sm font-medium text-slate-500">Loading sign-in screen...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
