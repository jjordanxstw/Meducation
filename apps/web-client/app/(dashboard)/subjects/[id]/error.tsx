'use client';

/**
 * Error Boundary for Subject Detail Page
 * Catches errors when loading individual subjects
 */

import { useEffect } from 'react';
import { Card, CardBody, Button } from '@heroui/react';
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
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card shadow="none" className="w-full max-w-md border border-slate-200/70 bg-white shadow-subtle">
        <CardBody className="gap-4 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <FiAlertTriangle className="h-7 w-7 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-slate-900">
              {isNotFound ? 'Subject Not Found' : 'Failed to Load Subject'}
            </h2>
            <p className="text-sm text-slate-500">
              {isNotFound
                ? 'This subject may have been removed or you don\'t have access to it.'
                : 'An error occurred while loading this subject. Please try again.'}
            </p>
          </div>

          {error.digest && <p className="font-mono text-xs text-slate-400">Error ID: {error.digest}</p>}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            {!isNotFound && (
              <Button color="primary" className="flex-1" startContent={<FiRefreshCw className="h-4 w-4" />} onPress={reset}>
                Try Again
              </Button>
            )}
            <Button
              as={Link}
              href="/subjects"
              variant="flat"
              className="flex-1"
              startContent={<FiArrowLeft className="h-4 w-4" />}
            >
              Back to Subjects
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
