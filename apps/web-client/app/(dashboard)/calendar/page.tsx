'use client';

/**
 * Calendar Page with FullCalendar Integration
 * Next.js adapted version
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardBody,
  useDisclosure,
} from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import type { EventClickArg } from '@fullcalendar/core';
import { api } from '@/lib/api';
import {
  formatDateTime,
  getEventTypeColor,
  getEventTypeLabel,
  EventType,
} from '@medical-portal/shared';
import type { CalendarEvent } from '@medical-portal/shared';
import { FiClock, FiMapPin, FiBook, FiRefreshCw, FiFilter, FiCheck, FiX, FiArrowRight } from 'react-icons/fi';
import { FullCalendarWrapper } from '@/components/client/FullCalendarWrapper';
import { CalendarCardSkeleton } from '@/components/skeletons/DashboardSkeletons';

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

// Event type badge colors
const EVENT_TYPE_BADGE: Record<string, string> = {
  exam: 'bg-red-500/20 text-red-300 border-red-500/30',
  lecture: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  holiday: 'bg-green-500/20 text-green-300 border-green-500/30',
  event: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export default function CalendarPage() {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [currentView, setCurrentView] = useState<CalendarView>('dayGridMonth');
  const [showFilter, setShowFilter] = useState(false);

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
    onOpen();
  };

  const handleGoToSubject = () => {
    if (selectedEvent?.subject_id) {
      router.push(`/subjects/${selectedEvent.subject_id}`);
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink-1)]">Academic Calendar</h1>
            <p className="text-base text-[var(--ink-2)]">Exam schedules, lectures, and events</p>
          </div>

          {/* Filter by type - styled button with popover */}
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-sm text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
            >
              <FiFilter size={14} />
              <span>Filter by type</span>
              {filterType !== 'all' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>

            {/* Custom dropdown with theme-aware background */}
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
                      {filterType === option.key && <FiCheck className="h-4 w-4" />}
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

      {/* Event Detail Modal - Theme-aware background with X close button */}
      {isOpen && selectedEvent && (
        <>
          {/* Scrim overlay */}
          <div
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm dark:bg-black/40"
            onClick={onClose}
          />
          {/* Modal card with theme-aware background */}
          <div className="fixed left-1/2 top-1/2 z-[70] min-w-[300px] max-w-[360px] w-[calc(100%-2rem)] bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-300/50 dark:shadow-black/70 p-5 -translate-x-1/2 -translate-y-1/2">
            {/* Header with title and X close button */}
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                  {selectedEvent.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white transition-colors shrink-0"
              >
                <FiX size={14} />
              </button>
            </div>

            {/* Event type badge */}
            <span className={`inline-block mt-3 text-xs px-2 py-0.5 rounded-full border ${EVENT_TYPE_BADGE[selectedEvent.type] || 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-white/70 dark:border-white/20'}`}>
              {getEventTypeLabel(selectedEvent.type)}
            </span>

            {/* Date & Time section */}
            <div className="flex items-start gap-3 mt-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <FiClock className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" size={16} />
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

            {/* Location section */}
            {selectedEvent.location && (
              <div className="flex items-start gap-3 mt-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <FiMapPin className="text-blue-500 dark:text-blue-400 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-blue-600/50 dark:text-blue-200/50 uppercase tracking-wide">Location</p>
                  <p className="text-sm text-slate-900 dark:text-white">{selectedEvent.location}</p>
                </div>
              </div>
            )}

            {/* Related Subject section */}
            {selectedEvent.subject_id && (
              <div className="flex items-start gap-3 mt-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <FiBook className="text-blue-500 dark:text-blue-400 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-blue-600/50 dark:text-blue-200/50 uppercase tracking-wide">Related Subject</p>
                  <button
                    onClick={handleGoToSubject}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline flex items-center gap-1"
                  >
                    View Subject <FiArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Description section */}
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
