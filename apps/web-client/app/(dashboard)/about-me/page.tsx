'use client';

import { Card, CardBody, Chip, Avatar } from '@nextui-org/react';
import { useAuthStore } from '@/stores/auth.store';
import { FiMail, FiUser, FiCalendar, FiMapPin, FiLogOut } from 'react-icons/fi';
import { signOut } from 'next-auth/react';
import { api } from '@/lib/api';
import { getYearLevelLabel } from '@medical-portal/shared';
import { useState, useCallback } from 'react';

// Coming Soon badge component - consistent across app
function ComingSoonBadge() {
  return (
    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
      Coming Soon
    </span>
  );
}

// Get initials from name (max 2 chars)
function getInitials(name: string | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

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
    <section className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
      {/* Profile Header Card */}
      <Card className="glass-card relative overflow-hidden">
        {/* Left accent bar - 4px blue gradient */}
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-blue-600" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_50%)]" />
        <CardBody className="gap-5 p-5 sm:gap-6 sm:p-8 pl-6 sm:pl-9">
          <div className="flex items-center gap-2">
            <Chip color="success" variant="flat" size="sm">
              Profile
            </Chip>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
            {/* Avatar - reduced size with ring */}
            <Avatar
              src={profile?.avatar_url || undefined}
              name={getInitials(profile?.full_name)}
              size="lg"
              className="h-16 w-16 text-xl ring-2 ring-blue-500/40"
            />

            {/* Info */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="line-clamp-2 text-2xl font-bold text-[var(--ink-1)] sm:text-3xl">
                {profile?.full_name || 'Student'}
              </h1>
              <p className="text-[var(--ink-2)] mt-1">
                {profile?.year_level ? getYearLevelLabel(profile.year_level) : 'Medical Student'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Profile Details - all icons blue */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="card-flat">
          <CardBody className="gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <FiUser className="text-blue-400 h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--ink-2)]">Full Name</p>
                <p className="line-clamp-2 font-medium text-foreground">
                  {profile?.full_name || '-'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="card-flat">
          <CardBody className="gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <FiMail className="text-blue-400 h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--ink-2)]">Email</p>
                <p className="font-medium text-foreground truncate">
                  {profile?.email || '-'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="card-flat">
          <CardBody className="gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <FiCalendar className="text-blue-400 h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--ink-2)]">Year Level</p>
                <p className="line-clamp-2 font-medium text-foreground">
                  {profile?.year_level ? getYearLevelLabel(profile.year_level) : '-'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="card-flat">
          <CardBody className="gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <FiMapPin className="text-blue-400 h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--ink-2)]">Student ID</p>
                {profile?.student_id ? (
                  <p className="line-clamp-2 font-medium text-foreground">
                    {profile.student_id}
                  </p>
                ) : (
                  <span className="text-slate-400 dark:text-white/30 text-sm italic">Not assigned yet</span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Settings Card */}
      <Card className="card-flat">
        <CardBody className="gap-0">
          <div className="p-4 pb-3">
            <h3 className="text-lg font-semibold text-foreground">Account Settings</h3>
            <p className="text-sm text-[var(--ink-2)]">Manage your account preferences</p>
          </div>

          {/* Row 1 with bottom border */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between min-h-[64px] px-4 py-3 border-b border-slate-100 dark:border-white/5">
            <div className="min-w-0">
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-[var(--ink-2)]">Receive updates about your courses</p>
            </div>
            <ComingSoonBadge />
          </div>

          {/* Row 2 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between min-h-[64px] px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium text-foreground">Language</p>
              <p className="text-sm text-[var(--ink-2)]">Choose your preferred language</p>
            </div>
            <ComingSoonBadge />
          </div>
        </CardBody>
      </Card>

      {/* Log out button - standalone at bottom */}
      <button
        onClick={() => void handleLogout()}
        disabled={isLoggingOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {isLoggingOut ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <FiLogOut size={15} />
        )}
        <span>{isLoggingOut ? 'Signing out...' : 'Sign out of Learning Portal'}</span>
      </button>
    </section>
  );
}
