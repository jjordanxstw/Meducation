'use client';

/**
 * Login Page with Google OAuth
 * Next.js adapted version
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardBody,
  Button,
  Divider,
  Chip,
} from '@nextui-org/react';
import { FcGoogle } from 'react-icons/fc';
import { useAuthStore } from '@/stores/auth.store';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

/**
 * Google Sign-In Component - Client-only
 * This component only renders on the client side
 */
function GoogleSignInButton() {
  const { setAuth, setLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });

      const buttonContainer = document.getElementById('google-signin-button');
      if (buttonContainer) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
          shape: 'rectangular',
        });
      }
    }
  };

  const handleGoogleCallback = async (response: { credential: string }) => {
    try {
      setLoading(true);

      // Send token to backend for verification
      const res = await fetch('/api/v1/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: response.credential }),
      });

      const data = await res.json();

      if (data.success) {
        setAuth(data.data.user, data.data.profile, response.credential);
        router.replace('/');
      } else {
        alert(data.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInClick = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      alert('Google Sign-In button not found — please wait for script to load or refresh the page');
    }
  };

  return (
    <>
      <div id="google-signin-button" className="flex justify-center"></div>

      <Divider className="my-4" />

      <Button
        color="primary"
        variant="shadow"
        size="lg"
        startContent={<FcGoogle className="w-5 h-5" />}
        onPress={handleSignInClick}
        className="w-full sm:w-auto font-semibold"
      >
        Sign in with Google
      </Button>
    </>
  );
}

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardBody className="gap-6 p-8">
          {/* Logo and Title */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-bold text-white shadow-lg">
              M
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Medical Learning Portal</h1>
              <p className="text-default-500">Learning system for medical students</p>
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
                  Please sign in with @student.mahidol.ac.th email
                </p>
              </div>
            </div>
          </Chip>

          {/* Google Sign-In */}
          <div className="min-h-[60px]">
            <GoogleSignInButton />
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-default-400">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
