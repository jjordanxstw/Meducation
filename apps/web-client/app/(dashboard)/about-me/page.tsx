'use client';

import { Card, CardBody, Chip, Avatar, Divider, Button } from '@nextui-org/react';
import { useAuthStore } from '@/stores/auth.store';
import { FiMail, FiUser, FiCalendar, FiMapPin, FiLogOut } from 'react-icons/fi';
import { signOut } from 'next-auth/react';
import { api } from '@/lib/api';
import { getYearLevelLabel } from '@medical-portal/shared';

export default function AboutMePage() {
  const { profile } = useAuthStore();

  const handleLogout = async () => {
    await api.auth.logout();
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <section className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
      {/* Profile Header Card */}
      <Card className="glass-card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_50%)]" />
        <CardBody className="gap-5 p-5 sm:gap-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Chip color="success" variant="flat" size="sm">
              Profile
            </Chip>
          </div>

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
            {/* Avatar */}
            <Avatar
              src={profile?.avatar_url || undefined}
              name={profile?.full_name || 'User'}
              size="lg"
              color="primary"
              className="h-24 w-24 text-3xl"
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

            {/* Actions */}
            <Button
              color="danger"
              variant="flat"
              className="btn-precise w-full justify-center sm:w-auto"
              startContent={<span className="icon-with-text"><FiLogOut className="h-4 w-4" /></span>}
              onPress={handleLogout}
            >
              Log out
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Profile Details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="card-flat">
          <CardBody className="gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FiUser className="text-primary h-5 w-5" />
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <FiMail className="text-warning h-5 w-5" />
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <FiCalendar className="text-success h-5 w-5" />
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
                <FiMapPin className="text-danger h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--ink-2)]">Student ID</p>
                <p className="line-clamp-2 font-medium text-foreground">
                  {profile?.student_id || '-'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Settings Card */}
      <Card className="card-flat">
        <CardBody className="gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Account Settings</h3>
            <p className="text-sm text-[var(--ink-2)]">Manage your account preferences</p>
          </div>
          <Divider />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-[var(--ink-2)]">Receive updates about your courses</p>
            </div>
            <Chip size="sm" variant="flat">Coming Soon</Chip>
          </div>
          <Divider />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-foreground">Language</p>
              <p className="text-sm text-[var(--ink-2)]">Choose your preferred language</p>
            </div>
            <Chip size="sm" variant="flat">Coming Soon</Chip>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
