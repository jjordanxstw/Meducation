'use client';

/**
 * Home Page - Redesigned
 * Next.js adapted version
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  FiVolume2,
  FiBookOpen,
  FiUsers,
  FiStar,
  FiRefreshCw,
  FiCalendar,
  FiTrendingUp,
} from 'react-icons/fi';
import {
  formatDateTime,
  getEventTypeColor,
  getEventTypeLabel,
  EventType,
} from '@medical-portal/shared';
import type { CalendarEvent } from '@medical-portal/shared';
import { FullCalendarWrapper } from '@/components/client/FullCalendarWrapper';
import { CalendarCardSkeleton } from '@/components/skeletons/DashboardSkeletons';
import type { EventClickArg } from '@fullcalendar/core';

// Year filter button component
function YearFilterButton({
  children,
  colorClass,
  onClick,
}: {
  children: React.ReactNode;
  colorClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-w-[130px] px-5 py-2.5 rounded-full border-2 font-semibold text-sm cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md ${colorClass}`}
    >
      {children}
    </button>
  );
}

// Feature navigation card component
function FeatureCard({
  title,
  subtitle,
  icon,
  iconBg,
  iconColor,
  titleColor,
  onClick,
  gradientTitle = false,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  onClick: () => void;
  gradientTitle?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-5 cursor-pointer border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg bg-white dark:bg-[#0d1b2e] border-slate-200 dark:border-white/10"
    >
      <div className="flex items-start gap-4">
        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          {gradientTitle ? (
            <h3 className="font-bold text-base">
              <span className="text-blue-500 dark:text-blue-300">Learning</span>{' '}
              <span className="text-yellow-400">Hub</span>
            </h3>
          ) : (
            <h3 className={`font-bold text-base ${titleColor}`}>{title}</h3>
          )}
          <p className="text-sm text-slate-500 dark:text-white/50 mt-0.5">{subtitle}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs border border-current font-medium text-slate-500 dark:text-white/50">
            {'>'} ดูเพิ่มเติม {'<'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Marquee items
const MARQUEE_ITEMS = [
  'Anatomy I',
  'SCID01',
  'Year 1 · 2 Lectures',
  'Academic Calendar',
  'New Announcements',
  'Learning Hub Coming Soon',
  'Check Your Schedule',
  'Fast Track Available',
];

// Mock announcements data (since no API endpoint exists)
const MOCK_ANNOUNCEMENTS = [
  {
    id: '1',
    title: 'Welcome to Learning Portal',
    content: 'Welcome to the new Learning Portal! Explore your subjects, check your calendar, and stay updated with announcements.',
    date: '2026-03-24',
  },
  {
    id: '2',
    title: 'Midterm Examination Schedule',
    content: 'Midterm examinations will be held from April 7-11, 2026. Please check the Academic Calendar for detailed schedules.',
    date: '2026-03-20',
  },
];

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

const VIEW_OPTIONS: { key: CalendarView; label: string }[] = [
  { key: 'dayGridMonth', label: 'Month' },
  { key: 'timeGridWeek', label: 'Week' },
  { key: 'timeGridDay', label: 'Day' },
];

// Event type colors for legend dots
const EVENT_TYPE_COLORS: Record<string, string> = {
  exam: 'bg-red-500',
  lecture: 'bg-blue-400',
  holiday: 'bg-green-400',
  event: 'bg-purple-400',
};

export default function HomePage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<CalendarView>('dayGridMonth');
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get current date range for the calendar (3 months range)
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  }, []);

  // Fetch calendar events
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['calendar', dateRange],
    queryFn: () => api.calendar.list(dateRange),
  });

  const events: (CalendarEvent & { subjects?: { name: string; code: string } })[] = useMemo(
    () => data?.data?.data ?? [],
    [data],
  );

  // Filter events by type
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter((event) => event.type === filterType);
  }, [events, filterType]);

  // Convert to FullCalendar format
  const calendarEvents = useMemo(() => {
    return filteredEvents.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start_time,
      end: event.end_time,
      allDay: event.is_all_day,
      backgroundColor: getEventTypeColor(event.type),
      borderColor: getEventTypeColor(event.type),
      extendedProps: {
        ...event,
      },
    }));
  }, [filteredEvents]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event.extendedProps as CalendarEvent;
    setSelectedEvent({
      ...event,
      id: clickInfo.event.id,
      title: clickInfo.event.title,
    });
    setIsModalOpen(true);
  };

  const handleGoToSubject = () => {
    if (selectedEvent?.subject_id) {
      router.push(`/subjects/${selectedEvent.subject_id}`);
      setIsModalOpen(false);
    }
  };

  const scrollToAnnouncement = () => {
    const element = document.getElementById('announcement-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION A — Top Two-Column Hero Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        {/* LEFT COLUMN — Announcement Card */}
        <div id="announcement-section">
          <Card className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
            {/* Header bar with gradient */}
            <div className="bg-gradient-to-r from-yellow-300 to-green-300 dark:from-yellow-400/80 dark:to-green-400/80 px-6 py-3">
              <div className="flex items-center gap-2">
                <FiVolume2 className="text-slate-800" size={20} />
                <span className="font-bold text-slate-800 text-lg tracking-wide">ANNOUNCEMENT</span>
              </div>
            </div>
            {/* Body */}
            <CardBody className="min-h-[180px] bg-slate-50 dark:bg-[#0d1b2e] p-4">
              {MOCK_ANNOUNCEMENTS.length > 0 ? (
                <div className="space-y-4">
                  {MOCK_ANNOUNCEMENTS.map((announcement) => (
                    <div key={announcement.id} className="border-b border-slate-200 dark:border-white/10 pb-3 last:border-0 last:pb-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{announcement.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-white/70 mt-1">{announcement.content}</p>
                      <p className="text-xs text-slate-400 dark:text-white/40 mt-2">{announcement.date}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FiVolume2 className="h-12 w-12 text-slate-300 dark:text-white/20 mb-3" />
                  <p className="text-slate-500 dark:text-white/50">No announcements yet.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* RIGHT COLUMN — Year Filter Buttons */}
        <div className="flex lg:flex-col gap-3 flex-wrap lg:flex-nowrap lg:items-end">
          <YearFilterButton
            colorClass="border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-300 dark:border-yellow-400/50"
            onClick={() => router.push('/subjects?year=fasttrack')}
          >
            Fast track
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300 dark:border-teal-400/50"
            onClick={() => router.push('/subjects?year=1')}
          >
            Year 1
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300 dark:border-teal-400/50"
            onClick={() => router.push('/subjects?year=2')}
          >
            Year 2
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300 dark:border-teal-400/50"
            onClick={() => router.push('/subjects?year=3')}
          >
            Year 3
          </YearFilterButton>
        </div>
      </div>

      {/* SECTION B — Infinite Horizontal Scrolling Banner */}
      <div className="my-8 relative w-full overflow-hidden py-3">
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {/* Duplicate items twice for seamless loop */}
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-400/10 border border-yellow-300 dark:border-yellow-400/30 text-yellow-700 dark:text-yellow-300 text-sm font-medium shrink-0"
            >
              <FiStar size={14} /> {item}
            </span>
          ))}
        </div>
      </div>

      {/* SECTION C — 4 Feature Navigation Cards (2x2 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
        <FeatureCard
          title="Announcement"
          subtitle="ประกาศข่าวจากฝ่ายวิชาการ"
          icon={<FiVolume2 size={22} />}
          iconBg="bg-yellow-100 dark:bg-yellow-400/10"
          iconColor="text-yellow-500"
          titleColor="text-blue-600 dark:text-blue-400"
          onClick={scrollToAnnouncement}
        />
        <FeatureCard
          title="Academics"
          subtitle="รวมเอกสารวิชาการ"
          icon={<FiBookOpen size={22} />}
          iconBg="bg-purple-100 dark:bg-purple-400/10"
          iconColor="text-purple-500"
          titleColor="text-purple-600 dark:text-purple-400"
          onClick={() => router.push('/subjects')}
        />
        <FeatureCard
          title=""
          subtitle="Learning Hub"
          icon={<FiTrendingUp size={22} />}
          iconBg="bg-sky-100 dark:bg-sky-400/10"
          iconColor="text-sky-500"
          titleColor=""
          gradientTitle={true}
          onClick={() => router.push('/learning-hub')}
        />
        <FeatureCard
          title="About Me"
          subtitle="รู้จักกับพวกเรา"
          icon={<FiUsers size={22} />}
          iconBg="bg-teal-100 dark:bg-teal-400/10"
          iconColor="text-teal-500"
          titleColor="text-teal-600 dark:text-teal-400"
          onClick={() => router.push('/about-us')}
        />
      </div>

      {/* SECTION D — Full Calendar */}
      <section className="mt-10">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Academic Calendar
              </h2>
              <p className="text-sm text-slate-500 dark:text-white/50">
                Exam schedules, lectures, and events
              </p>
            </div>

            {/* Filter by type */}
            <div className="relative">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-sm text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
              >
                <span>Filter by type</span>
                {filterType !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </button>

              {showFilter && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFilter(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 min-w-[160px] bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/80 p-2">
                    {[
                      { key: 'all', label: 'All Events' },
                      { key: 'exam', label: 'Exam' },
                      { key: 'lecture', label: 'Lecture' },
                      { key: 'holiday', label: 'Holiday' },
                      { key: 'event', label: 'Event' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        onClick={() => {
                          setFilterType(option.key);
                          setShowFilter(false);
                        }}
                        className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          filterType === option.key
                            ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span className={filterType === option.key ? '' : 'ml-6'}>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Legend and View Switcher */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Event legend with colored dots */}
            <div className="flex flex-wrap items-center gap-4">
              {Object.values(EventType).map((type) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${EVENT_TYPE_COLORS[type]}`} />
                  <span className="text-sm text-slate-600 dark:text-white/70">{getEventTypeLabel(type)}</span>
                </div>
              ))}
            </div>

            {/* View toggle - segmented control */}
            <div className="flex rounded-lg bg-slate-100 dark:bg-white/10 p-1">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setCurrentView(option.key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    currentView === option.key
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar */}
        {isError ? (
          <Card className="card-flat">
            <CardBody className="gap-4 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-50">
                  <FiRefreshCw className="text-danger" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-danger">Unable to load calendar events</h3>
                  <p className="text-sm text-default-500 mt-1">Please retry to load your calendar.</p>
                </div>
              </div>
              <button
                onClick={() => void refetch()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                <FiRefreshCw className="h-4 w-4" />
                Retry
              </button>
            </CardBody>
          </Card>
        ) : isLoading ? (
          <CalendarCardSkeleton />
        ) : (
          <Card className="glass-surface">
            <CardBody className="p-4 sm:p-6">
              <FullCalendarWrapper
                events={calendarEvents}
                onEventClick={handleEventClick}
                initialView={currentView}
                onViewChange={(view) => setCurrentView(view as CalendarView)}
              />
            </CardBody>
          </Card>
        )}
      </section>

      {/* Event Detail Modal */}
      {isModalOpen && selectedEvent && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm dark:bg-black/40"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[70] min-w-[300px] max-w-[360px] w-[calc(100%-2rem)] bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-300/50 dark:shadow-black/70 p-5 -translate-x-1/2 -translate-y-1/2">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                  {selectedEvent.title}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white transition-colors shrink-0"
              >
                ×
              </button>
            </div>

            <span className={`inline-block mt-3 text-xs px-2 py-0.5 rounded-full border ${
              selectedEvent.type === 'exam' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
              selectedEvent.type === 'lecture' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
              selectedEvent.type === 'holiday' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
              'bg-purple-500/20 text-purple-300 border-purple-500/30'
            }`}>
              {getEventTypeLabel(selectedEvent.type)}
            </span>

            <div className="flex items-start gap-3 mt-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <FiCalendar className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" size={16} />
              <div>
                <p className="text-xs text-blue-600/50 dark:text-blue-200/50 uppercase tracking-wide">Date & Time</p>
                <p className="text-sm text-slate-900 dark:text-white font-medium">{formatDateTime(selectedEvent.start_time)}</p>
                {selectedEvent.is_all_day ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">All Day Event</p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Until {formatDateTime(selectedEvent.end_time)}</p>
                )}
              </div>
            </div>

            {selectedEvent.location && (
              <div className="flex items-start gap-3 mt-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="text-blue-500 dark:text-blue-400 shrink-0">📍</span>
                <div>
                  <p className="text-xs text-blue-600/50 dark:text-blue-200/50 uppercase tracking-wide">Location</p>
                  <p className="text-sm text-slate-900 dark:text-white">{selectedEvent.location}</p>
                </div>
              </div>
            )}

            {selectedEvent.subject_id && (
              <div className="flex items-start gap-3 mt-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <FiBookOpen className="text-blue-500 dark:text-blue-400 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-blue-600/50 dark:text-blue-200/50 uppercase tracking-wide">Related Subject</p>
                  <button
                    onClick={handleGoToSubject}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline flex items-center gap-1"
                  >
                    View Subject →
                  </button>
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <p className="text-xs text-blue-600/50 dark:text-blue-200/50 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedEvent.description}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
