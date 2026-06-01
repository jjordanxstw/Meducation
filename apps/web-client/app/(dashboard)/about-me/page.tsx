'use client';

import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth.store';
import { Mail, User, Calendar, MapPin, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { api } from '@/lib/api';
import { getYearLevelLabel } from '@medical-portal/shared';
import { useState, useCallback } from 'react';
import { PageTransition } from '@/components/PageTransition';

// A single account-settings row. Locked rows are dimmed, non-interactive, and
// show a "Soon" badge but remain rendered for layout consistency.
function SettingRow({
  title,
  description,
  locked = false,
  withBorder = false,
  onClick,
}: {
  title: string;
  description: string;
  locked?: boolean;
  withBorder?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex min-h-[64px] flex-col gap-2 px-4 py-3 transition-colors duration-150 sm:flex-row sm:items-center sm:justify-between ${
        withBorder ? 'border-b border-slate-100' : ''
      } ${locked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}
    >
      <button
        type="button"
        onClick={locked ? undefined : onClick}
        className={`min-w-0 text-left ${locked ? 'pointer-events-none' : ''}`}
      >
        <p className={`font-medium ${locked ? 'text-slate-400' : 'text-slate-900'}`}>{title}</p>
        <p className={`text-sm ${locked ? 'text-slate-400/70' : 'text-slate-500'}`}>{description}</p>
      </button>
      {locked && (
        <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
          Soon
        </span>
      )}
    </div>
  );
}

function getInitials(name: string | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const DETAILS = (profile: ReturnType<typeof useAuthStore.getState>['profile']) => [
  { icon: User, label: 'Full Name', value: profile?.full_name || '-' },
  { icon: Mail, label: 'Email', value: profile?.email || '-' },
  {
    icon: Calendar,
    label: 'Year Level',
    value: profile?.year_level ? getYearLevelLabel(profile.year_level) : '-',
  },
  {
    icon: MapPin,
    label: 'Student ID',
    value: profile?.student_id || 'Not assigned yet',
    muted: !profile?.student_id,
  },
];

export default function AboutMePage() {
  const { profile } = useAuthStore();
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
    <PageTransition>
      <section className="mx-auto max-w-3xl space-y-6">
        {/* Profile header */}
        <Card className="overflow-hidden">
          <CardBody className="flex flex-col gap-5 p-5 pt-5 sm:p-8">
            <Badge variant="brand" className="w-fit">
              Profile
            </Badge>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
              <Avatar size="lg" className="h-16 w-16 text-xl ring-2 ring-brand/30">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile?.full_name || 'Profile'} />
                ) : null}
                <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h1 className="line-clamp-2 font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  {profile?.full_name || 'Student'}
                </h1>
                <p className="mt-1 text-slate-500">
                  {profile?.year_level ? getYearLevelLabel(profile.year_level) : 'Medical Student'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Detail cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {DETAILS(profile).map((detail) => (
            <Card key={detail.label}>
              <CardBody className="p-5 pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle">
                    <detail.icon className="h-5 w-5 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">{detail.label}</p>
                    <p className={`line-clamp-2 font-medium ${detail.muted ? 'italic text-slate-400' : 'text-slate-900'}`}>
                      {detail.value}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Settings */}
        <Card>
          <CardBody className="flex flex-col gap-0 p-0">
            <div className="p-4 pb-3">
              <h3 className="font-serif text-lg font-semibold tracking-tight text-slate-900">Account Settings</h3>
              <p className="text-sm text-slate-500">Manage your account preferences</p>
            </div>
            <SettingRow title="Email Notifications" description="Receive updates about your courses" locked withBorder />
            <SettingRow title="Language" description="Choose your preferred language" locked />
          </CardBody>
        </Card>

        {/* Log out */}
        <button
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoggingOut ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <LogOut size={15} />
          )}
          <span>{isLoggingOut ? 'Signing out...' : 'Sign out of MedPi Portal'}</span>
        </button>
      </section>
    </PageTransition>
  );
}
