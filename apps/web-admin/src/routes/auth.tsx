/**
 * Admin login (Brilliant: 04 Admin — Login): a single centred card.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useLogin, useIsAuthenticated } from '@refinedev/core';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Cross, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="flex min-h-screen w-full items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-[400px] rounded-2xl border border-slate-200/70 bg-white p-7 shadow-soft">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-ink-1 text-white">
            <Cross className="size-4" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight text-ink-1">MedPi Admin</span>
            <span className="block text-[11px] text-ink-3">Content studio</span>
          </span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-1">Sign in</h1>
        <p className="mt-1 text-[13px] text-ink-3">Admins only. One active session per account.</p>

        {error ? (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="text-ink-3 hover:text-ink-1"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="mt-px size-3.5 shrink-0 text-amber-600" aria-hidden />
            <span>Signing in here signs you out of your other open admin session.</span>
          </div>

          <Button type="submit" className="w-full" loading={isPending}>
            Sign in
          </Button>
          <p className="text-center text-[11px] text-ink-3">5 failed attempts lock sign-in for 15 minutes</p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
