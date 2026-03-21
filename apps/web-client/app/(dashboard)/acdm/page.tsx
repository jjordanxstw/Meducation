'use client';

import { Card, CardBody, Chip } from '@nextui-org/react';
import { FiTrendingUp, FiAward, FiBookOpen, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useAuthStore } from '@/stores/auth.store';
import { getYearLevelLabel } from '@medical-portal/shared';

// Circular Progress Ring SVG Component
function CircularProgressRing({ progress, size = 120, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-default-100"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500"
      />
      {/* Gradient definition - single blue hue instead of blue-to-purple */}
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Widget Card Component
function WidgetCard({
  icon,
  iconColor,
  title,
  children,
  hasComingSoon = false,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  children: React.ReactNode;
  hasComingSoon?: boolean;
}) {
  return (
    <Card className="rounded-2xl bg-white dark:bg-[var(--surface-1)] border border-slate-200 dark:border-white/10 p-6 relative overflow-hidden shadow-sm dark:shadow-none">
      <CardBody className="p-0 gap-4">
        <div className="flex items-center justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColor}`}>
            {icon}
          </div>
          {hasComingSoon && (
            <Chip size="sm" className="bg-amber-500/20 text-amber-500 dark:text-amber-400 text-xs font-medium border border-amber-500/30">
              Coming Soon
            </Chip>
          )}
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          {children}
        </div>
      </CardBody>
    </Card>
  );
}

export default function AcdmPage() {
  const { profile } = useAuthStore();

  // Mock data for demonstration
  const progressData = {
    overallProgress: 68,
    gpa: 3.45,
    gpaTrend: 'up' as 'up' | 'down',
    enrolledSubjects: ['MD101', 'MD102', 'MD103', 'MD104', 'MD105'],
  };

  return (
    <section className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--ink-1)] sm:text-3xl">Academic Dashboard</h1>
          <Chip color="primary" variant="flat" size="sm" className="font-medium">
            ACDM
          </Chip>
        </div>
        <p className="text-base text-[var(--ink-2)]">
          {profile?.year_level ? `${getYearLevelLabel(profile.year_level)} academic overview` : 'Your academic progress at a glance'}
        </p>
      </div>

      {/* 3-Column Widget Layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Widget 1: Overall Progress */}
        <WidgetCard
          icon={<FiTrendingUp className="h-5 w-5 text-blue-400" />}
          iconColor="bg-blue-500/15"
          title="Overall Progress"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <CircularProgressRing progress={progressData.overallProgress} size={100} strokeWidth={8} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{progressData.overallProgress}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-500">Completion rate</p>
              <p className="text-sm text-slate-400 dark:text-slate-400">Based on enrolled subjects</p>
            </div>
          </div>
        </WidgetCard>

        {/* Widget 2: Current GPA/Score */}
        <WidgetCard
          icon={<FiAward className="h-5 w-5 text-purple-500 dark:text-purple-400" />}
          iconColor="bg-purple-100 dark:bg-purple-500/15"
          title="Current GPA"
          hasComingSoon
        >
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">{progressData.gpa.toFixed(2)}</span>
            <div className={`flex items-center gap-1 pb-1 ${progressData.gpaTrend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {progressData.gpaTrend === 'up' ? (
                <FiArrowUp className="h-4 w-4" />
              ) : (
                <FiArrowDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">0.15</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Updated this semester</p>
        </WidgetCard>

        {/* Widget 3: Subjects Enrolled */}
        <WidgetCard
          icon={<FiBookOpen className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />}
          iconColor="bg-emerald-100 dark:bg-emerald-500/15"
          title="Subjects Enrolled"
        >
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900 dark:text-white">{progressData.enrolledSubjects.length}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400 pb-1">active subjects</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {progressData.enrolledSubjects.slice(0, 5).map((code) => (
                <Chip
                  key={code}
                  size="sm"
                  variant="flat"
                  className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs"
                >
                  {code}
                </Chip>
              ))}
              {progressData.enrolledSubjects.length > 5 && (
                <Chip
                  size="sm"
                  variant="flat"
                  className="bg-slate-100 dark:bg-white/5 text-slate-500 text-xs"
                >
                  +{progressData.enrolledSubjects.length - 5} more
                </Chip>
              )}
            </div>
          </div>
        </WidgetCard>
      </div>

      {/* Additional Info Section */}
      <Card className="glass-card">
        <CardBody className="gap-3 p-5">
          <p className="text-sm text-[var(--ink-2)]">
            Your academic dashboard is being enhanced with more features. Track your progress,
            view grades, and monitor your academic performance here.
          </p>
        </CardBody>
      </Card>
    </section>
  );
}
