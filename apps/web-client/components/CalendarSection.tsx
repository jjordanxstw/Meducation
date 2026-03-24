'use client';

/**
 * Calendar Section Component
 * Google Calendar style layout with custom event rendering
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Card, CardBody } from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import type { EventClickArg, DatesSetArg } from '@fullcalendar/core';
import type { EventContentArg } from '@fullcalendar/core/index.js';
import { api } from '@/lib/api';
import {
  formatDateTime,
  getEventTypeLabel,
  EventType,
} from '@medical-portal/shared';
import type { CalendarEvent } from '@medical-portal/shared';
import { FiRefreshCw, FiX, FiBookOpen, FiCalendar, FiChevronLeft, FiChevronRight, FiChevronDown, FiSliders } from 'react-icons/fi';
import { FullCalendarWrapper } from '@/components/client/FullCalendarWrapper';
import { CalendarCardSkeleton } from '@/components/skeletons/DashboardSkeletons';

// Static month options (all 12 months)
const ALL_MONTHS = [
  { value: '0', label: 'January' },
  { value: '1', label: 'February' },
  { value: '2', label: 'March' },
  { value: '3', label: 'April' },
  { value: '4', label: 'May' },
  { value: '5', label: 'June' },
  { value: '6', label: 'July' },
  { value: '7', label: 'August' },
  { value: '8', label: 'September' },
  { value: '9', label: 'October' },
  { value: '10', label: 'November' },
  { value: '11', label: 'December' },
];

// Static year options
const YEARS = ['2026', '2027', '2028', '2029', '2030'];

// Weekday labels
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Event type colors for bars
const EVENT_TYPE_COLORS: Record<string, string> = {
  exam: 'bg-red-500',
  lecture: 'bg-blue-500',
  holiday: 'bg-green-500',
  event: 'bg-purple-500',
};

// Event type emojis
const EVENT_TYPE_EMOJIS: Record<string, string> = {
  exam: '📝',
  lecture: '📖',
  holiday: '🎉',
  event: '📅',
};

// Event type badge colors for modal
const EVENT_TYPE_BADGE: Record<string, string> = {
  exam: 'bg-red-500/20 text-red-300 border-red-500/30',
  lecture: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  holiday: 'bg-green-500/20 text-green-300 border-green-500/30',
  event: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export function CalendarSection() {
  const router = useRouter();
  const calendarRef = useRef<React.ComponentRef<typeof FullCalendarWrapper> | null>(null);

  // Initialize with current month/year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(now.getMonth()));
  const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()));
  const [activeWeekdays, setActiveWeekdays] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get current date range for the calendar (expanded range for navigation)
  const dateRange = useMemo(() => {
    const year = Number(selectedYear) || now.getFullYear();
    const month = selectedMonth !== '' ? Number(selectedMonth) : now.getMonth();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month + 2, 0);
    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  }, [selectedMonth, selectedYear]);

  // Fetch calendar events
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['calendar', dateRange],
    queryFn: () => api.calendar.list(dateRange),
  });

  const events: (CalendarEvent & { subjects?: { name: string; code: string } })[] = useMemo(
    () => data?.data?.data ?? [],
    [data],
  );

  // Check if any filters are active
  const hasActiveFilters = activeWeekdays.length > 0 || filterType !== 'all';

  // Reset all filters
  const resetFilters = useCallback(() => {
    setActiveWeekdays([]);
    setFilterType('all');
  }, []);

  // Toggle weekday
  const toggleWeekday = useCallback((day: number) => {
    setActiveWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  // Filter events by type and weekday
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Type filter
      if (filterType !== 'all' && event.type !== filterType) return false;

      const d = new Date(event.start_time);

      // Weekday filter
      if (activeWeekdays.length > 0 && !activeWeekdays.includes(d.getDay())) return false;

      return true;
    });
  }, [events, filterType, activeWeekdays]);

  // Convert to FullCalendar format
  const calendarEvents = useMemo(() => {
    return filteredEvents.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start_time,
      end: event.end_time,
      allDay: event.is_all_day,
      extendedProps: {
        ...event,
      },
    }));
  }, [filteredEvents]);

  // Current month label for navigation
  const currentMonthLabel = useMemo(() => {
    const y = selectedYear || String(now.getFullYear());
    const m = selectedMonth !== '' ? Number(selectedMonth) : now.getMonth();
    return new Date(Number(y), m).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  }, [selectedMonth, selectedYear]);

  // Custom event content renderer - Google Calendar style
  const eventContent = useCallback((eventInfo: EventContentArg) => {
    const { event, timeText } = eventInfo;
    const type = (event.extendedProps?.type as string) || 'event';

    const barColor = EVENT_TYPE_COLORS[type] ?? 'bg-blue-500';
    const emoji = EVENT_TYPE_EMOJIS[type] ?? '📅';

    return (
      <div className="flex items-center gap-1 w-full px-1 py-0.5 rounded overflow-hidden group">
        {/* Colored left bar (3px wide) */}
        <div className={`w-[3px] h-3.5 rounded-full shrink-0 ${barColor}`} />

        {/* Time */}
        {timeText && (
          <span className="text-[10px] text-slate-500 dark:text-white/50 shrink-0 font-medium tabular-nums">
            {timeText} ·
          </span>
        )}

        {/* Emoji */}
        <span className="text-[11px] shrink-0">{emoji}</span>

        {/* Title */}
        <span className="text-[11px] font-medium text-slate-700 dark:text-white/80 truncate leading-tight">
          {event.title}
        </span>
      </div>
    );
  }, []);

  // Handle event click
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event.extendedProps as CalendarEvent;
    setSelectedEvent({
      ...event,
      id: clickInfo.event.id,
      title: clickInfo.event.title,
    });
    setIsModalOpen(true);
  }, []);

  // Handle dates set - sync with dropdowns when navigating
  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {
    const d = dateInfo.start;
    // Add 7 days to land in the correct month (start is often last day of previous month)
    const currentDate = new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000);
    setSelectedMonth(String(currentDate.getMonth()));
    setSelectedYear(String(currentDate.getFullYear()));
  }, []);

  // Navigate calendar when month/year changes
  useEffect(() => {
    const api = (calendarRef.current as unknown as { getApi?: () => { gotoDate: (date: Date) => void } })?.getApi?.();
    if (!api) return;

    const year = selectedYear ? Number(selectedYear) : now.getFullYear();
    const month = selectedMonth !== '' ? Number(selectedMonth) : now.getMonth();

    api.gotoDate(new Date(year, month, 1));
  }, [selectedMonth, selectedYear]);

  // Navigation handlers
  const goToPrev = useCallback(() => {
    (calendarRef.current as unknown as { getApi?: () => { prev: () => void } })?.getApi?.()?.prev();
  }, []);

  const goToNext = useCallback(() => {
    (calendarRef.current as unknown as { getApi?: () => { next: () => void } })?.getApi?.()?.next();
  }, []);

  const goToToday = useCallback(() => {
    (calendarRef.current as unknown as { getApi?: () => { today: () => void } })?.getApi?.()?.today();
    setSelectedMonth(String(now.getMonth()));
    setSelectedYear(String(now.getFullYear()));
  }, []);

  const handleGoToSubject = () => {
    if (selectedEvent?.subject_id) {
      router.push(`/subjects/${selectedEvent.subject_id}`);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      {/* Navigation Row */}
      <div className="flex items-center justify-between mb-4">
        {/* Left: Title */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Academic Calendar
          </h2>
          <p className="text-sm text-slate-400 dark:text-white/40 mt-0.5">
            Exam schedules, lectures, and events
          </p>
        </div>

        {/* Right: Prev/Current/Next navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-white/8 border border-slate-200 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/80 transition"
            aria-label="Previous month"
          >
            <FiChevronLeft size={17} />
          </button>

          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-full text-sm font-semibold border hover:bg-slate-100 dark:hover:bg-white/10 transition min-w-[140px] text-center bg-white dark:bg-white/8 border-slate-200 dark:border-white/20 text-slate-800 dark:text-white"
          >
            {currentMonthLabel}
          </button>

          <button
            onClick={goToNext}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-white/8 border border-slate-200 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/80 transition"
            aria-label="Next month"
          >
            <FiChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Month selector */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2 rounded-full text-sm font-medium cursor-pointer bg-white dark:bg-[#0d1b2e] border-2 border-blue-500 text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">All Months</option>
            {ALL_MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <FiChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
          />
        </div>

        {/* Year selector */}
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2 rounded-full text-sm font-medium cursor-pointer bg-white dark:bg-[#0d1b2e] border-2 border-blue-500 text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <FiChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
          />
        </div>

        {/* Weekday filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {WEEKDAY_LABELS.map((day, i) => (
            <button
              key={day}
              onClick={() => toggleWeekday(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-150 cursor-pointer ${
                activeWeekdays.includes(i)
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15'
                  : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-white/60 bg-white dark:bg-transparent hover:border-blue-400 hover:text-blue-500'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Reset filters */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition"
          >
            <FiX size={12} /> Reset
          </button>
        )}
      </div>

      {/* Event type filter and legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        {/* Event type filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition border-slate-200 dark:border-white/20 text-slate-600 dark:text-white/70 bg-white dark:bg-white/8 hover:bg-slate-100 dark:hover:bg-white/15"
          >
            <FiSliders size={14} />
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
              <div className="absolute left-0 top-full mt-2 z-50 min-w-[160px] bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/80 p-2">
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

        {/* Event legend with colored dots */}
        <div className="flex flex-wrap items-center gap-4">
          {Object.values(EventType).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${EVENT_TYPE_COLORS[type]}`} />
              <span className="text-sm text-slate-600 dark:text-white/70">{getEventTypeLabel(type)}</span>
            </div>
          ))}
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
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm bg-white dark:bg-transparent">
          {/* FullCalendar CSS overrides for Google Calendar style */}
          <style jsx global>{`
            /* Day cell height */
            .fc .fc-daygrid-day {
              min-height: 100px !important;
            }

            /* Day number styling */
            .fc .fc-daygrid-day-number {
              font-size: 13px;
              font-weight: 500;
              color: #64748b;
              padding: 6px 8px;
            }

            /* Today's date - blue circle */
            .fc .fc-day-today .fc-daygrid-day-number {
              background: #2563eb;
              color: white;
              border-radius: 50%;
              width: 26px;
              height: 26px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0;
              margin: 4px;
            }

            /* Today cell background - very subtle */
            .fc .fc-day-today {
              background: transparent !important;
            }

            /* Header row (SUN MON TUE...) */
            .fc .fc-col-header {
              background: transparent !important;
            }
            .fc .fc-col-header-cell {
              background: transparent !important;
              border-color: transparent !important;
              padding: 8px 0;
            }
            .fc .fc-col-header-cell-cushion {
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #94a3b8;
              text-decoration: none !important;
            }
            .dark .fc .fc-col-header-cell-cushion {
              color: rgba(255,255,255,0.35);
            }

            /* Cell borders - very subtle */
            .fc .fc-daygrid-day {
              border-color: #e2e8f0 !important;
            }
            .dark .fc .fc-daygrid-day {
              border-color: rgba(255,255,255,0.06) !important;
            }

            /* Remove blue background on events - use our custom style */
            .fc .fc-daygrid-event {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              margin: 1px 2px !important;
            }

            /* "+X more" link */
            .fc .fc-daygrid-more-link {
              font-size: 10px;
              color: #3b82f6;
              font-weight: 500;
              padding: 0 4px;
            }
            .fc .fc-daygrid-more-link:hover {
              text-decoration: underline;
            }

            /* Out-of-month dates - muted */
            .fc .fc-day-other .fc-daygrid-day-number {
              color: #cbd5e1;
            }
            .dark .fc .fc-day-other .fc-daygrid-day-number {
              color: rgba(255,255,255,0.15);
            }

            /* Remove FullCalendar toolbar (we use our own) */
            .fc .fc-toolbar {
              display: none !important;
            }

            /* Event hover state */
            .fc .fc-daygrid-event:hover {
              background: rgba(59, 130, 246, 0.05) !important;
            }
          `}</style>

          <div className="p-4 sm:p-6">
            <FullCalendarWrapper
              ref={calendarRef}
              events={calendarEvents}
              onEventClick={handleEventClick}
              initialView="dayGridMonth"
              onDatesSet={handleDatesSet}
              eventContent={eventContent}
            />
          </div>
        </div>
      )}

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

            <span className={`inline-block mt-3 text-xs px-2 py-0.5 rounded-full border ${EVENT_TYPE_BADGE[selectedEvent.type] || 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-white/70 dark:border-white/20'}`}>
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
    </>
  );
}
