'use client';

/**
 * Error boundary for every signed-in page: a designed recovery state instead
 * of a blank screen.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500/40" aria-hidden />
      <h1 className="text-xl font-semibold tracking-tight text-ink-1">Something went wrong</h1>
      <p className="max-w-sm text-sm text-ink-3">
        This page hit an unexpected error. Trying again usually fixes it; if it keeps happening, let the MedPi team know.
      </p>
      {error.digest ? <p className="font-mono text-xs text-ink-3">Error ID: {error.digest}</p> : null}
      <div className="mt-2 flex gap-2">
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Go to Today</Link>
        </Button>
      </div>
    </div>
  );
}
