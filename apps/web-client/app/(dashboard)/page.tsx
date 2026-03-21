'use client';

/**
 * Home Page
 * Next.js adapted version
 */

import Link from 'next/link';
import { Card, CardBody, Button, Chip } from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { FiBook, FiCalendar, FiClock, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { getYearLevelLabel, formatDateThai, getEventTypeColor } from '@medical-portal/shared';
import type { Subject, CalendarEvent } from '@medical-portal/shared';
import { EventListSkeleton, SubjectGridSkeleton } from '@/components/skeletons/DashboardSkeletons';
import { SectionHeader } from '@/components/ui/SectionHeader';

// Preset brand colors for subject accent bars
const SUBJECT_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
];

// Generate consistent color based on subject code
function getSubjectColor(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

export default function HomePage() {
  const { profile } = useAuthStore();

  // Fetch subjects for user's year level
  const {
    data: subjectsData,
    isLoading: isSubjectsLoading,
    isError: isSubjectsError,
    refetch: refetchSubjects,
  } = useQuery({
    queryKey: ['subjects', profile?.year_level],
    queryFn: () => api.subjects.list(profile?.year_level || undefined),
    enabled: !!profile,
  });

  // Fetch upcoming events
  const {
    data: eventsData,
    isLoading: isEventsLoading,
    isError: isEventsError,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: () => api.calendar.upcoming(5),
  });

  const subjects = subjectsData?.data?.data || [];
  const upcomingEvents = eventsData?.data?.data || [];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome Section - Bold hero treatment */}
      <Card className="glass-card relative overflow-hidden text-[var(--ink-1)]">
        {/* Left accent bar - bolder width */}
        <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600" />
        {/* Subtle gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent" />
        <CardBody className="gap-5 p-5 pl-7 sm:p-8 sm:pl-10">
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Hello, {profile?.full_name || 'Student'}
                </h1>
                {profile?.year_level && (
                  <Chip size="sm" color="primary" variant="solid" className="text-xs font-semibold px-3">
                    {getYearLevelLabel(profile.year_level)}
                  </Chip>
                )}
              </div>
              <p className="text-base text-[var(--ink-2)]">
                Ready to continue your medical education journey?
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <Link href="/subjects" className="flex-1 sm:flex-none">
                <button className="flex w-full items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 sm:w-auto">
                  <FiBook className="h-4 w-4" />
                  Start Learning
                </button>
              </Link>
              <Link href="/calendar" className="flex-1 sm:flex-none">
                <button className="flex w-full items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all duration-200 hover:border-slate-300 sm:w-auto dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:border-white/30">
                  <FiCalendar className="h-4 w-4" />
                  View Calendar
                </button>
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 55/45 Layout */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[55fr_45fr]">
        {/* Subjects Section - 55% */}
        <section className="space-y-3">
          <SectionHeader
            title="Your Subjects"
            description="Select subjects you want to study"
            actions={
              <Link
                href="/subjects"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                View All
                <FiArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            }
          />

          {isSubjectsError ? (
            <Card className="glass-surface">
              <CardBody className="gap-3 p-6">
                <h3 className="text-base font-semibold text-danger-600">Couldn&apos;t load subjects</h3>
                <p className="text-sm text-default-600">Check your connection and try again.</p>
                <Button
                  color="primary"
                  variant="flat"
                  className="btn-precise"
                  startContent={<span className="icon-with-text"><FiRefreshCw className="h-4 w-4" /></span>}
                  onPress={() => void refetchSubjects()}
                >
                  Try Again
                </Button>
              </CardBody>
            </Card>
          ) : isSubjectsLoading ? (
            <SubjectGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {subjects.slice(0, 4).map((subject: Subject) => (
                <Link key={subject.id} href={`/subjects/${subject.id}`}>
                  <Card
                    isPressable
                    isBlurred
                    className="glass-surface h-full max-h-[160px] overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group"
                  >
                    {/* Colored accent bar - 4px */}
                    <div className={`h-1 w-full bg-gradient-to-r ${getSubjectColor(subject.code)}`} />
                    <CardBody className="gap-2 p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <FiBook className="text-primary text-base" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                            <Chip size="sm" color="primary" variant="flat" className="h-5 text-[10px] font-medium px-2">
                              {subject.code}
                            </Chip>
                            <span className="text-[10px] text-slate-500 dark:text-white/50">Year {subject.year_level}</span>
                          </div>
                          <h3 className="font-semibold text-foreground text-sm mb-0.5 line-clamp-1">
                            {subject.name}
                          </h3>
                          <p className="text-xs text-default-500 line-clamp-2">
                            {subject.description || 'No description available'}
                          </p>
                        </div>
                      </div>
                      {/* Hover indicator */}
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                        <span className="text-xs font-medium text-primary flex items-center gap-1">
                          Open <FiArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {!isSubjectsLoading && subjects.length === 0 && (
            <Card className="glass-surface">
              <CardBody className="text-center py-12">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-default-100/50">
                  <FiBook className="h-6 w-6 text-slate-400 dark:text-default-400 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-white/80 mb-1">No Subjects Available</h3>
                <p className="text-sm text-slate-500 dark:text-white/50">No subjects found for your year level</p>
              </CardBody>
            </Card>
          )}
        </section>

        {/* Upcoming Events Section - 45% */}
        <section className="space-y-3">
          <SectionHeader
            title="Upcoming Events"
            description="Important schedules"
          />

          {isEventsError ? (
            <Card className="glass-surface">
              <CardBody className="gap-3 p-6">
                <h3 className="text-base font-semibold text-danger-600">Couldn&apos;t load events</h3>
                <p className="text-sm text-default-600">Check your connection and try again.</p>
                <Button
                  color="primary"
                  variant="flat"
                  className="btn-precise"
                  startContent={<span className="icon-with-text"><FiRefreshCw className="h-4 w-4" /></span>}
                  onPress={() => void refetchEvents()}
                >
                  Try Again
                </Button>
              </CardBody>
            </Card>
          ) : isEventsLoading ? (
            <EventListSkeleton count={4} />
          ) : upcomingEvents.length > 0 ? (
            <Card className="card-flat border divider-y-0">
              {upcomingEvents.map((event: CalendarEvent & { subjects?: { name: string } }) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-4 transition-colors hover:bg-default-100/50 last:rounded-b-[var(--radius-md)] last:[&:not(:first-child)]:rounded-b-[var(--radius-md)]"
                >
                  <div
                    className="h-full w-1 rounded-full shrink-0"
                    style={{ backgroundColor: getEventTypeColor(event.type) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground mb-1 line-clamp-2">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-default-500">
                      <FiClock className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{formatDateThai(event.start_time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          ) : (
            <Card className="glass-surface">
              <CardBody className="text-center py-10">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-default-100/50">
                  <FiCalendar className="h-6 w-6 text-slate-400 dark:text-default-400 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-white/80 mb-1">You&apos;re all caught up!</h3>
                <p className="text-sm text-slate-500 dark:text-white/50 mb-4">No upcoming events in the next 7 days.</p>
                <Link href="/calendar">
                  <Button
                    variant="ghost"
                    className="btn-precise text-primary hover:text-primary-600"
                    startContent={<span className="icon-with-text"><FiCalendar className="h-4 w-4" /></span>}
                  >
                    View Full Calendar
                  </Button>
                </Link>
              </CardBody>
            </Card>
          )}

          {upcomingEvents.length > 0 && (
            <Link href="/calendar">
              <Button
                variant="flat"
                color="primary"
                className="btn-precise w-full justify-center font-semibold"
                startContent={<span className="icon-with-text"><FiCalendar className="h-4 w-4" /></span>}
                endContent={<span className="icon-with-text"><FiArrowRight className="h-4 w-4" /></span>}
              >
                View Full Calendar
              </Button>
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
