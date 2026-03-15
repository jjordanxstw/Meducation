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
import { getYearLevelLabel, formatDateThai, getEventTypeColor, getEventTypeLabel } from '@medical-portal/shared';
import type { Subject, CalendarEvent } from '@medical-portal/shared';
import { EventListSkeleton, SubjectGridSkeleton } from '@/components/skeletons/DashboardSkeletons';
import { SectionHeader } from '@/components/ui/SectionHeader';

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
      {/* Welcome Section */}
      <Card className="glass-card relative overflow-hidden text-[var(--ink-1)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.2),transparent_40%),radial-gradient(circle_at_80%_18%,rgba(14,165,233,0.15),transparent_45%)]" />
        <CardBody className="gap-4 p-4 sm:p-6">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold sm:text-2xl">
                Hello, {profile?.full_name || 'Student'} 👋
              </h1>
              <p className="text-sm text-[var(--ink-2)] sm:text-base">
                {profile?.year_level ? getYearLevelLabel(profile.year_level) : 'Welcome to Medical Learning Portal'}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:gap-3">
              <Link href="/subjects" className="flex-1 sm:flex-none">
                <Button
                  color="primary"
                  variant="solid"
                  className="btn-precise w-full justify-center font-semibold sm:w-auto"
                  startContent={<span className="icon-with-text"><FiBook className="h-4 w-4" /></span>}
                >
                  Start Learning
                </Button>
              </Link>
              <Link href="/calendar" className="flex-1 sm:flex-none">
                <Button
                  variant="bordered"
                  className="btn-precise card-flat w-full justify-center text-[var(--ink-1)] font-semibold sm:w-auto"
                  startContent={<span className="icon-with-text"><FiCalendar className="h-4 w-4" /></span>}
                >
                  Calendar
                </Button>
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Subjects Section */}
        <section className="space-y-3 lg:col-span-2">
          <SectionHeader
            title="Your Subjects"
            description="Select subjects you want to study"
            actions={
              <Link
                href="/subjects"
                className="group inline-flex items-center gap-1 text-sm font-semibold text-primary"
              >
                View All
                <FiArrowRight className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            }
          />

          {isSubjectsError ? (
            <Card className="glass-surface">
              <CardBody className="gap-3 p-6">
                <h3 className="text-base font-semibold text-danger-600">Unable to load subjects</h3>
                <p className="text-sm text-default-600">Please retry to fetch your subject list.</p>
                <Button
                  color="primary"
                  variant="flat"
                  className="btn-precise"
                  startContent={<span className="icon-with-text"><FiRefreshCw className="h-4 w-4" /></span>}
                  onPress={() => void refetchSubjects()}
                >
                  Retry
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
                    className="glass-surface h-full hover:scale-[1.02] transition-transform"
                  >
                    <CardBody className="gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                          <FiBook className="text-primary text-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Chip size="sm" color="primary" variant="flat">
                            {subject.code}
                          </Chip>
                          <h3 className="font-semibold text-foreground line-clamp-2">
                            {subject.name}
                          </h3>
                          <p className="text-sm text-default-500 line-clamp-2">
                            {subject.description || 'No description'}
                          </p>
                        </div>
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
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-default-100">
                  <FiBook className="text-default-400 text-2xl" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No Subjects</h3>
                <p className="text-default-500 text-sm">No subjects available for your year level</p>
              </CardBody>
            </Card>
          )}
        </section>

        {/* Upcoming Events Section */}
        <section className="space-y-3">
          <SectionHeader
            title="Upcoming Events"
            description="Important schedules"
          />

          {isEventsError ? (
            <Card className="glass-surface">
              <CardBody className="gap-3 p-6">
                <h3 className="text-base font-semibold text-danger-600">Unable to load upcoming events</h3>
                <p className="text-sm text-default-600">Please retry to fetch your schedule.</p>
                <Button
                  color="primary"
                  variant="flat"
                  className="btn-precise"
                  startContent={<span className="icon-with-text"><FiRefreshCw className="h-4 w-4" /></span>}
                  onPress={() => void refetchEvents()}
                >
                  Retry
                </Button>
              </CardBody>
            </Card>
          ) : isEventsLoading ? (
            <EventListSkeleton count={4} />
          ) : (
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
                    <div className="flex items-center gap-2 text-sm text-default-500 mb-2">
                      <FiClock className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{formatDateThai(event.start_time)}</span>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      style={{
                        backgroundColor: `${getEventTypeColor(event.type)}15`,
                        color: getEventTypeColor(event.type),
                      }}
                    >
                      {getEventTypeLabel(event.type)}
                    </Chip>
                  </div>
                </div>
              ))}

              {upcomingEvents.length === 0 && (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-default-100">
                    <FiCalendar className="text-default-400 text-2xl" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">No Events</h3>
                  <p className="text-default-500 text-sm">No upcoming events</p>
                </div>
              )}
            </Card>
          )}

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
        </section>
      </div>
    </div>
  );
}
