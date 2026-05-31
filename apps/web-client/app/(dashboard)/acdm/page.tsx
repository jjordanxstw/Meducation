'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * ACDM Page - Redirects to /subjects
 * This page now redirects to the subjects page as per the new navigation structure
 */
export default function AcdmPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/subjects');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Redirecting to Subjects...</p>
      </div>
    </div>
  );
}
