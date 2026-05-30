'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Calendar Page - Redirects to home page
 * The calendar is now displayed on the home page
 */
export default function CalendarPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Redirecting...</p>
      </div>
    </div>
  );
}
