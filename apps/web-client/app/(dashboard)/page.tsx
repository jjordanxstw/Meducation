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
import { FiBook, FiCalendar, FiClock, FiArrowRight } from 'react-icons/fi';
import { getYearLevelLabel, formatDateThai, getEventTypeColor, getEventTypeLabel } from '@medical-portal/shared';
import type { Subject, CalendarEvent } from '@medical-portal/shared';
import { EventListSkeleton, SubjectGridSkeleton } from '@/components/skeletons/DashboardSkeletons';

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
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <CardBody className="gap-4 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Hello, {profile?.full_name || 'Student'} 👋
              </h1>
              <p className="text-blue-50 text-sm sm:text-base">
                {profile?.year_level ? getYearLevelLabel(profile.year_level) : 'Welcome to Medical Learning Portal'}
              </p>
            </div>
            <div className="flex flex-row gap-2 sm:flex-col sm:w-auto">
              <Link href="/subjects">
                <Button
                  color="primary"
                  variant="solid"
                  className="bg-white text-primary shadow-md w-full sm:w-auto font-semibold"
                  startContent={<FiBook />}
                >
                  Start Learning
                </Button>
              </Link>
              <Link href="/calendar">
                <Button
                  variant="bordered"
                  className="border-white text-white w-full sm:w-auto font-semibold"
                  startContent={<FiCalendar />}
                >
                  View Calendar
                </Button>
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subjects Section */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Your Subjects</h2>
              <p className="text-default-500 text-sm">Select subjects you want to study</p>
            </div>
            <Link
              href="/subjects"
              className="text-primary font-semibold text-sm flex items-center gap-1 group"
            >
              View All
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {isSubjectsError ? (
            <Card>
              <CardBody className="gap-3 p-6">
                <h3 className="text-base font-semibold text-danger-600">Unable to load subjects</h3>
                <p className="text-sm text-default-600">Please retry to fetch your subject list.</p>
                <Button color="primary" variant="flat" onPress={() => void refetchSubjects()}>
                  Retry
                </Button>
              </CardBody>
            </Card>
          ) : isSubjectsLoading ? (
            <SubjectGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.slice(0, 4).map((subject: Subject) => (
                <Link key={subject.id} href={`/subjects/${subject.id}`}>
                  <Card
                    isPressable
                    isBlurred
                    className="h-full hover:scale-[1.02] transition-transform"
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
            <Card>
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
        <section className="space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Upcoming Events</h2>
            <p className="text-default-500 text-sm">Important schedules</p>
          </div>

          {isEventsError ? (
            <Card>
              <CardBody className="gap-3 p-6">
                <h3 className="text-base font-semibold text-danger-600">Unable to load upcoming events</h3>
                <p className="text-sm text-default-600">Please retry to fetch your schedule.</p>
                <Button color="primary" variant="flat" onPress={() => void refetchEvents()}>
                  Retry
                </Button>
              </CardBody>
            </Card>
          ) : isEventsLoading ? (
            <EventListSkeleton count={4} />
          ) : (
            <Card className="border divider-y-0">
              {upcomingEvents.map((event: CalendarEvent & { subjects?: { name: string } }) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-4 hover:bg-default-50 transition-colors last:rounded-b-xl last:[&:not(:first-child)]:rounded-b-xl"
                >
                  <div
                    className="h-full w-1 rounded-full shrink-0"
                    style={{ backgroundColor: getEventTypeColor(event.type) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground mb-1 line-clamp-2">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-default-500 mb-2">
                      <FiClock className="h-4 w-4 shrink-0" />
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
              className="w-full font-semibold"
              endContent={<FiArrowRight />}
            >
              View Full Calendar
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
