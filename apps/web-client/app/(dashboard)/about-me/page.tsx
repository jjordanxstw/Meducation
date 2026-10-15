'use client';

/**
 * Me (Brilliant: Student Desktop / Me). Profile (read-only, from the Mahidol
 * Google account), signed-in devices with per-device sign-out, this browser's
 * recently-opened list, and sign-out.
 */

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import { Laptop, Lock, LogOut, Smartphone, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/PageTransition';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { forgetRecentlyOpened, useRecentlyOpened } from '@/lib/recently-opened';
import { formatDay } from '@/lib/dates';
import { useAuthStore } from '@/stores/auth.store';

type Session = { id: string; created: string; device: string; browser: string; current?: boolean };

function initials(name: string | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function titleCase(value: string): string {
  return value === 'unknown' ? '' : value.charAt(0).toUpperCase() + value.slice(1);
}

function DeviceIcon({ device }: { device: string }) {
  if (/ipad|tablet/i.test(device)) return <Tablet className="h-4 w-4" aria-hidden />;
  if (/mobile|iphone|android/i.test(device)) return <Smartphone className="h-4 w-4" aria-hidden />;
  return <Laptop className="h-4 w-4" aria-hidden />;
}

function Devices() {
  const queryClient = useQueryClient();
  const { data: sessions = [], isLoading, isError } = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => ((await api.auth.sessions()).data?.data?.sessions ?? []) as Session[],
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });

  const revokeOne = useMutation({
    mutationFn: (id: string) => api.auth.revokeSession(id),
    onSuccess: () => {
      notify.success('Signed out of that device');
      refresh();
    },
    onError: () => notify.error('Couldn’t sign that device out. Try again.'),
  });
  const revokeOthers = useMutation({
    mutationFn: () => api.auth.revokeOtherSessions(),
    onSuccess: () => {
      notify.success('Signed out of your other devices');
      refresh();
    },
    onError: () => notify.error('Couldn’t sign out other devices. Try again.'),
  });

  const others = sessions.filter((session) => !session.current);

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white shadow-subtle" aria-labelledby="devices">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 px-5 py-4">
        <div>
          <h2 id="devices" className="text-base font-semibold text-ink-1">
            Signed-in devices
          </h2>
          <p className="mt-0.5 text-xs text-ink-3">Up to 5 devices. Signing in on a 6th signs out the oldest.</p>
        </div>
        {others.length > 0 ? (
          <button
            type="button"
            onClick={() => revokeOthers.mutate()}
            disabled={revokeOthers.isPending}
            className="shrink-0 text-sm font-semibold text-red-700 hover:text-red-800 disabled:opacity-60"
          >
            {revokeOthers.isPending ? 'Signing out…' : 'Sign out other devices'}
          </button>
        ) : null}
      </div>
      {isLoading ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      ) : isError ? (
        <p className="p-5 text-sm text-ink-3">Couldn’t load your devices right now.</p>
      ) : sessions.length === 0 ? (
        <p className="p-5 text-sm text-ink-3">No saved sign-ins besides this browser.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {sessions.map((session) => {
            const name = [titleCase(session.device), titleCase(session.browser)].filter(Boolean).join(' · ') || 'Browser';
            return (
              <li key={session.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-ink-2">
                  <DeviceIcon device={session.device} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink-1">
                    {name}
                    {session.current ? (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">This device</span>
                    ) : null}
                  </span>
                  <span className="block text-xs text-ink-3 tabular">Signed in {formatDay(session.created)}</span>
                </span>
                {session.current ? null : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeOne.mutate(session.id)}
                    disabled={revokeOne.isPending && revokeOne.variables === session.id}
                  >
                    Sign out
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function MePage() {
  const profile = useAuthStore((state) => state.profile);
  const recent = useRecentlyOpened();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await api.auth.logout();
      await signOut({ callbackUrl: '/login' });
    } catch {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  return (
    <PageTransition className="mx-auto max-w-3xl space-y-4">
      <header className="mb-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-1">Me</h1>
        <p className="mt-0.5 text-sm text-ink-3">Your account, devices and recently opened list</p>
      </header>

      <section className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-subtle">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-lg font-semibold text-brand-hover">
          {initials(profile?.full_name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-ink-1">{profile?.full_name || 'Student'}</p>
          <p className="truncate text-sm text-ink-3">{profile?.email}</p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          {profile?.year_level ? (
            <span className="rounded-md bg-brand-subtle px-1.5 py-0.5 text-xs font-semibold text-brand-hover">Year {profile.year_level}</span>
          ) : null}
          <p className="mt-1 text-xs text-ink-3 tabular">Student ID {profile?.student_id || '–'}</p>
        </div>
      </section>

      <p className="flex gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-ink-2">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden />
        Name, photo, student ID and year come from your Mahidol Google account. If something is wrong, contact the MedPi team on the About page.
      </p>

      <Devices />

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-subtle">
        <div>
          <h2 className="text-base font-semibold text-ink-1">Recently opened on this device</h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Quick-access shortcuts on Today and in the sidebar; stored in this browser only
            {recent.length > 0 ? ` · ${recent.length} saved` : ''}.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={forgetRecentlyOpened} disabled={recent.length === 0}>
          Clear list
        </Button>
      </section>

      <div className="flex justify-end pt-2">
        <Button
          variant="secondary"
          className="border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {isLoggingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </PageTransition>
  );
}
