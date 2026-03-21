'use client';

/**
 * Error Boundary for Subject Detail Page
 * Catches errors when loading individual subjects
 */

import { useEffect } from 'react';
import { Card, CardBody, Button } from '@nextui-org/react';
import { FiAlertTriangle, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function SubjectDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Subject detail error:', error);
  }, [error]);

  // Check if it's a 404-type error
  const isNotFound = error.message?.toLowerCase().includes('not found') ||
    error.message?.toLowerCase().includes('404');

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="glass-surface max-w-md w-full">
        <CardBody className="gap-4 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
            <FiAlertTriangle className="h-7 w-7 text-amber-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--ink-1)]">
              {isNotFound ? 'Subject Not Found' : 'Failed to Load Subject'}
            </h2>
            <p className="text-sm text-[var(--ink-2)]">
              {isNotFound
                ? 'This subject may have been removed or you don\'t have access to it.'
                : 'An error occurred while loading this subject. Please try again.'}
            </p>
          </div>

          {error.digest && (
            <p className="text-xs text-slate-400 dark:text-white/30 font-mono">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!isNotFound && (
              <Button
                color="primary"
                variant="solid"
                className="btn-precise flex-1"
                startContent={<span className="icon-with-text"><FiRefreshCw className="h-4 w-4" /></span>}
                onPress={reset}
              >
                Try Again
              </Button>
            )}
            <Link href="/subjects" className="flex-1">
              <Button
                variant="flat"
                className="btn-precise w-full"
                startContent={<span className="icon-with-text"><FiArrowLeft className="h-4 w-4" /></span>}
              >
                Back to Subjects
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
