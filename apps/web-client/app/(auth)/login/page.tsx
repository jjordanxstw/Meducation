'use client';

/**
 * Login Page using NextAuth Google OAuth
 */

import { useEffect } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import {
  Card,
  CardBody,
  Button,
  Divider,
  Chip,
} from '@nextui-org/react';
import { FcGoogle } from 'react-icons/fc';

function LoginContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/auth/sync');
    }
  }, [status, router]);

  const handleSignInClick = async () => {
    const to = searchParams.get('to') || '/';
    await signIn('google', { callbackUrl: `/auth/sync?to=${encodeURIComponent(to)}` });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-glass-canvas p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.28),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.24),transparent_42%),radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.2),transparent_38%)]" />
      <Card className="glass-card w-full max-w-md shadow-2xl">
        <CardBody className="gap-6 p-8">
          {/* Logo and Title */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 text-xl font-bold text-sky-700 shadow-lg backdrop-blur">
              {/* TODO: Replace with brand logo image provided by user */}
              L
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Learning Portal</h1>
              <p className="text-slate-600">Secure sign-in for medical students</p>
            </div>
          </div>

          <Divider />

          {/* Notice */}
          <Chip
            color="primary"
            variant="flat"
            size="lg"
            className="w-full justify-start py-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📌</span>
              <div className="text-left">
                <p className="font-semibold text-primary">For Medical Students Only</p>
                <p className="text-sm text-default-600">
                  Sign in with your Google account
                </p>
              </div>
            </div>
          </Chip>

          <Button
            color="primary"
            variant="shadow"
            size="lg"
            startContent={<FcGoogle className="h-5 w-5" />}
            onPress={handleSignInClick}
            className="w-full font-semibold"
            isLoading={status === 'loading'}
          >
            Continue with Google
          </Button>

          {/* Terms */}
          <p className="text-center text-xs text-slate-500">
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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-glass-canvas p-4">
          <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center shadow-2xl">
            <p className="text-sm font-medium text-slate-700">Loading sign-in screen...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
