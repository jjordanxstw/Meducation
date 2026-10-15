'use client';

/**
 * Shown when a signed-in Google account isn't allowed (wrong domain) or an
 * API call returns 403.
 */

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Lock } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForbiddenPage() {
  const { data: session } = useSession();
  const [busy, setBusy] = useState(false);
  const email = session?.user?.email;

  const switchAccount = async () => {
    setBusy(true);
    try {
      await api.auth.logout();
    } finally {
      await signOut({ callbackUrl: '/login' });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center">
      <Lock className="h-12 w-12 text-brand/60" strokeWidth={1.5} aria-hidden />
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3">Access denied</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-1">This account can’t use MedPi</h1>
      <p className="mt-1 max-w-sm text-sm text-ink-3">
        {email ? `You signed in with ${email}. ` : ''}Sign out and use your @student.mahidol.ac.th or @student.mahidol.edu account.
      </p>
      <button
        type="button"
        onClick={() => void switchAccount()}
        disabled={busy}
        className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {busy ? 'Signing out…' : 'Switch account'}
      </button>
    </main>
  );
}
