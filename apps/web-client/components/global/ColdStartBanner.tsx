'use client';

/**
 * "Waking the server…" (Brilliant: Student Mobile / Cold start state).
 * The API runs on Render Free, which sleeps after a quiet spell; the first
 * request then takes ~30 s. If any query has been loading for more than a few
 * seconds, explain the wait instead of leaving students staring at skeletons.
 */

import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { Hourglass } from 'lucide-react';

const SHOW_AFTER_MS = 4000;
const EXPECTED_MS = 30000;

export function ColdStartBanner() {
  const fetching = useIsFetching() > 0;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!fetching) return;
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 500);
    return () => {
      clearInterval(timer);
      setElapsed(0);
    };
  }, [fetching]);

  if (!fetching || elapsed < SHOW_AFTER_MS) return null;

  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-lift">
        <div className="flex gap-3">
          <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-1">Waking the server…</p>
            <p className="mt-0.5 text-xs text-ink-3">The first visit after a quiet spell takes about 30 seconds. Your page will load by itself.</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${Math.min(95, (elapsed / EXPECTED_MS) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
