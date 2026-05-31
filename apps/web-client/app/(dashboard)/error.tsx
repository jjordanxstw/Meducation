'use client';

/**
 * Error Boundary for Dashboard
 * Catches runtime errors and provides a recovery UI
 */

import { useEffect } from 'react';
import { Card, CardBody, Button } from '@heroui/react';
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
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card shadow="none" className="w-full max-w-md border border-slate-200/70 bg-white shadow-subtle">
        <CardBody className="gap-4 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <FiAlertTriangle className="h-7 w-7 text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-slate-900">Something went wrong</h2>
            <p className="text-sm text-slate-500">
              An unexpected error occurred. Please try again or return to the home page.
            </p>
          </div>

          {error.digest && <p className="font-mono text-xs text-slate-400">Error ID: {error.digest}</p>}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button color="primary" className="flex-1" startContent={<FiRefreshCw className="h-4 w-4" />} onPress={reset}>
              Try Again
            </Button>
            <Button
              as={Link}
              href="/"
              variant="flat"
              className="flex-1"
              startContent={<FiHome className="h-4 w-4" />}
            >
              Go Home
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
