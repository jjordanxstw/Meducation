/**
 * Admin Login Route — light blue/white theme, English only.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useLogin, useIsAuthenticated } from '@refinedev/core';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export function LoginPage() {
  const { mutateAsync: login, isPending } = useLogin();
  const { data: authData, isLoading: isCheckingAuth } = useIsAuthenticated();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (authData?.authenticated === true) {
      navigate('/dashboard', { replace: true });
    }
  }, [authData, navigate]);

  // Show loading while checking auth status
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Spinner className="size-8" />
      </div>
    );
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }

    try {
      const result = await login({ username, password });
      if (result.success) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message?: string }).message)
          : 'Invalid username or password';
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      {/* Left branding panel (desktop only) */}
      <div className="relative hidden w-3/5 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand to-brand-hover md:flex">
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-3 text-center">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-white">MedPi Admin</h1>
          <p className="max-w-xs text-sm text-white/80">
            Content management for the medical learning portal
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center p-6 md:w-2/5">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="mb-6 text-center md:text-left">
            <div className="mb-3 flex items-center justify-center gap-2 md:hidden">
              <span className="font-serif text-lg font-semibold text-slate-900">MedPi Admin</span>
            </div>
            <h2 className="font-serif text-xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in with your admin account</p>
          </div>

          {error ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="e.g. admin01"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" loading={isPending}>
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
