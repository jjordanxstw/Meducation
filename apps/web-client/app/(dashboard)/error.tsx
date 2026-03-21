'use client';

/**
 * Error Boundary for Dashboard
 * Catches runtime errors and provides a recovery UI
 */

import { useEffect } from 'react';
import { Card, CardBody, Button } from '@nextui-org/react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="glass-surface max-w-md w-full">
        <CardBody className="gap-4 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <FiAlertTriangle className="h-7 w-7 text-red-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--ink-1)]">
              Something went wrong
            </h2>
            <p className="text-sm text-[var(--ink-2)]">
              An unexpected error occurred. Please try again or return to the home page.
            </p>
          </div>

          {error.digest && (
            <p className="text-xs text-slate-400 dark:text-white/30 font-mono">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              color="primary"
              variant="solid"
              className="btn-precise flex-1"
              startContent={<span className="icon-with-text"><FiRefreshCw className="h-4 w-4" /></span>}
              onPress={reset}
            >
              Try Again
            </Button>
            <Link href="/" className="flex-1">
              <Button
                variant="flat"
                className="btn-precise w-full"
                startContent={<span className="icon-with-text"><FiHome className="h-4 w-4" /></span>}
              >
                Go Home
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
