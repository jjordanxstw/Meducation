'use client';

/**
 * Calendar Section Component
 * Ant Design Calendar with custom event rendering and responsive mobile support.
 * English-only, single light theme.
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@heroui/react';
import { Calendar } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useCalendarEvents } from '@/hooks/use-calendar';
import { DataFreshnessDot } from '@/components/ui/DataFreshnessDot';
import {
  formatDateThai,
  getEventTypeLabel,
  EventType,
} from '@medical-portal/shared';
import type { CalendarEvent } from '@medical-portal/shared';
import { FiRefreshCw, FiX, FiBookOpen, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { CalendarCardSkeleton } from '@/components/skeletons/DashboardSkeletons';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { PillDropdown } from '@/components/ui/PillDropdown';

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

// Event type badge colors for modal (exam=red, lecture=blue, holiday=amber, event=emerald)
const EVENT_TYPE_BADGE: Record<string, string> = {
  exam: 'bg-red-50 text-red-600 border-red-200',
  lecture: 'bg-blue-50 text-blue-600 border-blue-200',
  holiday: 'bg-amber-50 text-amber-600 border-amber-200',
  event: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

// Solid hex per type — used for the modal title accent border.
const EVENT_TYPE_HEX: Record<string, string> = {
  exam: '#ef4444',
  lecture: '#3b82f6',
  holiday: '#f59e0b',
  event: '#10b981',
};

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Detects whether a date string carries a meaningful (non-midnight) time.
function hasTime(value: string): boolean {
  return /T\d{2}:\d{2}/.test(value) && !/T00:00(:00)?/.test(value);
}

export function CalendarSection() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 639px)');

  // Single state: current calendar date (controls which month is shown)
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<
    (CalendarEvent & { subjects?: { name: string; code: string } }) | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Day-click modal state (mobile)
  const [dayClickDate, setDayClickDate] = useState<Dayjs | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Derived month/year for dropdowns
  const selectedMonth = currentDate.month(); // 0-indexed
  const selectedYear = currentDate.year();

  const ALL_MONTHS = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: MONTH_LABELS[i],
    }));
  }, []);

  const YEARS = useMemo(() => {
    const y = dayjs().year();
    return Array.from({ length: 5 }, (_, i) => y + i);
  }, []);

  // Fetch calendar events keyed by month so re-visiting a month is cache-served.
  const {
    data: events = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useCalendarEvents(currentDate.format('YYYY-MM'));

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilterType('all');
  }, []);

  // Filter events by type
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filterType !== 'all' && event.type !== filterType) return false;
      return true;
    });
  }, [events, filterType]);

  // Helper: find events that overlap a given date string
  const getEventsForDate = useCallback((dateStr: string) => {
    return filteredEvents.filter((ev) => {
      const start = ev.start_date.split('T')[0];
      const end = (ev.end_date ?? ev.start_date).split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  }, [filteredEvents]);

  // Current month label for navigation
  const currentMonthLabel = `${MONTH_LABELS[currentDate.month()]} ${currentDate.year()}`;

  // Whether the displayed month has any (filtered) events — drives empty state.
  const monthHasEvents = useMemo(() => {
    const m = currentDate.format('YYYY-MM');
    return filteredEvents.some((ev) => {
      const start = ev.start_date.slice(0, 7);
      const end = (ev.end_date ?? ev.start_date).slice(0, 7);
      return start <= m && m <= end;
    });
  }, [filteredEvents, currentDate]);

  // Navigation — simple state updates, no refs or API calls
  const goToPrev = useCallback(() => setCurrentDate((d) => d.subtract(1, 'month')), []);
  const goToNext = useCallback(() => setCurrentDate((d) => d.add(1, 'month')), []);

  const handleGoToSubject = () => {
    if (selectedEvent?.subject_id) {
      router.push(`/subjects/${selectedEvent.subject_id}`);
      setIsModalOpen(false);
    }
  };

  // Compute events for the clicked day (mobile day modal)
  const dayEvents = useMemo(() => {
    if (!dayClickDate) return [];
    return getEventsForDate(dayClickDate.format('YYYY-MM-DD'));
  }, [dayClickDate, getEventsForDate]);

  // --- cellRender: handles both desktop event bars and mobile dots ---

  const cellRender = useCallback((date: Dayjs, info: { type: string; originNode: React.ReactNode }) => {
    if (info.type !== 'date') return info.originNode;

    const dateStr = date.format('YYYY-MM-DD');
    const isToday = date.isSame(dayjs(), 'day');
    const dayEvts = getEventsForDate(dateStr);

    // Date number with optional today styling
    const dateNumber = (
      <span
        className={`inline-flex items-center justify-center text-[13px] font-medium leading-none shrink-0 ${
          isToday ? 'w-[26px] h-[26px] rounded-full bg-[#2563eb] text-white' : 'text-slate-500'
        }`}
      >
        {date.date()}
      </span>
    );

    // Clicking the cell opens day events modal
    const handleCellClick = () => {
      setDayClickDate(date);
      setShowDayModal(true);
    };

    if (isMobile) {
      // Mobile: date number + colored dots
      const uniqueTypes = [...new Set(dayEvts.map((e) => e.type))];
      return (
        <div
          className="flex flex-col items-center justify-center gap-1 cursor-pointer h-full w-full p-2"
          onClick={handleCellClick}
        >
          {dateNumber}
          {uniqueTypes.length > 0 && (
            <div className="flex gap-0.5">
              {uniqueTypes.map((type) => (
                <span
                  key={type}
                  className={`w-1.5 h-1.5 rounded-full ${EVENT_TYPE_COLORS[type] ?? 'bg-blue-500'}`}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Desktop: date number + event bars (visual only, whole cell is clickable)
    return (
      <div
        className="flex flex-col h-full w-full cursor-pointer p-1.5"
        onClick={handleCellClick}
      >
        <div className="mb-0.5">{dateNumber}</div>
        <div className="flex-1 space-y-[1px] overflow-hidden">
          {dayEvts.slice(0, 3).map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-1 w-full px-1 py-0.5"
            >
              <div className={`w-[3px] h-3.5 rounded-full shrink-0 ${EVENT_TYPE_COLORS[ev.type] ?? 'bg-blue-500'}`} />
              <span className="text-[10px] shrink-0">{EVENT_TYPE_EMOJIS[ev.type] ?? '📅'}</span>
              <span className="text-[11px] font-medium text-slate-700 truncate leading-tight">
                {ev.title}
              </span>
            </div>
          ))}
          {dayEvts.length > 3 && (
            <span className="text-[10px] text-blue-500 font-medium px-1">
              +{dayEvts.length - 3} more
            </span>
          )}
        </div>
      </div>
    );
  }, [isMobile, getEventsForDate]);

  // Filter options
  const filterOptions = [
    { key: 'all', label: 'All Events' },
    { key: 'exam', label: 'Exam' },
    { key: 'lecture', label: 'Lecture' },
    { key: 'holiday', label: 'Holiday' },
    { key: 'event', label: 'Event' },
  ];

  return (
    <>
      {/* Navigation Row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Calendar</h2>
          <p className="text-sm text-slate-400 mt-0.5">Exam schedules, lectures, and events</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            aria-label="Previous month"
          >
            <FiChevronLeft size={17} />
          </button>

          <button
            onClick={() => setCurrentDate(dayjs())}
            className="px-4 py-2 rounded-full text-sm font-semibold border hover:bg-slate-100 transition min-w-[140px] text-center bg-white border-slate-200 text-slate-800"
          >
            {currentMonthLabel}
          </button>

          <button
            onClick={goToNext}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            aria-label="Next month"
          >
            <FiChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Month selector */}
        <PillDropdown
          ariaLabel="Academic Calendar"
          value={selectedMonth}
          options={ALL_MONTHS.map((m) => ({ value: m.value, label: m.label }))}
          onChange={(value) => setCurrentDate((d) => d.month(Number(value)))}
        />

        {/* Year selector */}
        <PillDropdown
          ariaLabel="Academic Calendar"
          value={selectedYear}
          options={YEARS.map((year) => ({ value: year, label: String(year) }))}
          onChange={(value) => setCurrentDate((d) => d.year(Number(value)))}
        />

        {/* Event type filter */}
        <PillDropdown
          ariaLabel="Filter by type"
          value={filterType}
          options={filterOptions.map((option) => ({
            value: option.key,
            label: option.key === 'all' ? 'Filter by type' : `Filter by type: ${option.label}`,
          }))}
          onChange={setFilterType}
        />

        {/* Reset filters */}
        {filterType !== 'all' && (
          <button
            onClick={resetFilters}
            className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition"
          >
            <FiX size={12} /> Reset
          </button>
        )}

        {/* Event legend with colored dots */}
        <div className="flex flex-wrap items-center gap-3 ml-auto max-w-full sm:max-w-[58%] justify-start sm:justify-end">
          {Object.values(EventType).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${EVENT_TYPE_COLORS[type]}`} />
              <span className="text-sm text-slate-600">{getEventTypeLabel(type)}</span>
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
        <div className="relative rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <DataFreshnessDot isFetching={isFetching && !isLoading} />
          <div className="px-4 sm:px-6 pt-4">
            <div className="grid grid-cols-7 gap-0 border-b border-slate-200 pb-3 text-center">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 whitespace-nowrap">
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Ant Design Calendar CSS overrides */}
          <style jsx global>{`
            .ant-picker-calendar {
              background: transparent !important;
            }
            .ant-picker-calendar .ant-picker-panel {
              background: transparent !important;
              border: none !important;
            }
            .ant-picker-calendar-header {
              display: none !important;
            }
            .ant-picker-content thead {
              display: none !important;
            }
            .ant-picker-body {
              padding: 0 !important;
            }

            /* Equal-width columns */
            .ant-picker-content {
              table-layout: fixed !important;
              width: 100% !important;
              border-collapse: collapse !important;
            }

            /* Remove antd pseudo-elements */
            .ant-picker-cell::before,
            .ant-picker-cell::after {
              display: none !important;
            }
            .ant-picker-cell {
              padding: 0 !important;
              vertical-align: top !important;
              height: 104px !important;
            }

            /* Fixed height, no padding (cellRender handles its own padding) */
            .ant-picker-cell-inner {
              height: 100% !important;
              width: 100% !important;
              padding: 0 !important;
              border-radius: 0 !important;
              border-color: color-mix(in srgb, #94a3b8 25%, transparent) !important;
              border-style: solid !important;
              border-width: 0 1px 1px 0 !important;
              margin: 0 !important;
              line-height: normal !important;
              background: transparent !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }

            /* Hover on the cell itself — covers full area */
            .ant-picker-cell:hover .ant-picker-cell-inner {
              background: color-mix(in srgb, #94a3b8 8%, transparent) !important;
            }

            /* Out-of-month cells */
            .ant-picker-cell:not(.ant-picker-cell-in-view) .ant-picker-cell-inner {
              opacity: 0.35;
            }

            /* Remove antd's default today indicator */
            .ant-picker-cell-today .ant-picker-cell-inner::before {
              display: none !important;
            }

            /* Hide antd's default date number */
            .ant-picker-calendar-date-value {
              display: none !important;
            }

            /* Content wrappers fill entire cell */
            .ant-picker-calendar-date {
              height: 100% !important;
              min-height: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .ant-picker-calendar-date-content {
              height: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            /* Header row */
            .ant-picker-content thead th {
              font-size: 11px !important;
              font-weight: 600 !important;
              letter-spacing: 0.08em !important;
              text-transform: uppercase !important;
              color: #94a3b8 !important;
              padding: 10px 0 !important;
              border-color: color-mix(in srgb, #94a3b8 25%, transparent) !important;
              text-align: center !important;
            }

            /* Remove antd selected/range styling */
            .ant-picker-cell-selected .ant-picker-cell-inner,
            .ant-picker-cell-range-start .ant-picker-cell-inner,
            .ant-picker-cell-range-end .ant-picker-cell-inner {
              background: transparent !important;
            }

            /* Mobile */
            @media (max-width: 639px) {
              .ant-picker-cell {
                height: auto !important;
              }
              .ant-picker-cell-inner {
                height: auto !important;
                aspect-ratio: 1 !important;
                padding: 4px !important;
              }
              .ant-picker-content thead th {
                font-size: 9px !important;
                padding: 4px 0 !important;
              }
            }
          `}</style>

          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            <Calendar
              value={currentDate}
              onPanelChange={(date) => setCurrentDate(date)}
              cellRender={cellRender}
              headerRender={() => null}
            />

            {/* Empty month state — shown below the grid, not overlapping it */}
            {!monthHasEvents && (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                <FiCalendar className="h-8 w-8 text-slate-300 opacity-30" />
                <p className="text-sm text-slate-400">No events this month</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {isModalOpen && selectedEvent && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[70] min-w-[300px] max-w-[360px] w-[calc(100%-2rem)] bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-300/50 p-5 -translate-x-1/2 -translate-y-1/2">
            <div className="flex justify-between items-start gap-3">
              <div
                className="flex-1 min-w-0 border-l-4 pl-3"
                style={{ borderColor: selectedEvent.color || EVENT_TYPE_HEX[selectedEvent.type] || '#3b82f6' }}
              >
                <h2 className="text-lg font-bold text-slate-900 line-clamp-2">
                  {selectedEvent.title}
                </h2>
                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border ${EVENT_TYPE_BADGE[selectedEvent.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {getEventTypeLabel(selectedEvent.type)}
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors shrink-0"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="flex items-start gap-3 mt-4 p-3 rounded-xl bg-slate-50">
              <FiCalendar className="text-blue-500 mt-0.5 shrink-0" size={16} />
              <div>
                <p className="text-xs text-blue-600/50 uppercase tracking-wide">Date</p>
                {(() => {
                  const start = dayjs(selectedEvent.start_date);
                  const end = selectedEvent.end_date ? dayjs(selectedEvent.end_date) : null;
                  const timed = hasTime(selectedEvent.start_date);
                  const multiDay = end ? !end.isSame(start, 'day') : false;

                  if (multiDay && end) {
                    return (
                      <p className="text-sm text-slate-900 font-medium">
                        {start.format('ddd, D MMM YYYY')} – {end.format('ddd, D MMM YYYY')}
                      </p>
                    );
                  }

                  const timeLabel = !timed
                    ? 'All day'
                    : end && timed
                      ? `${start.format('HH:mm')} – ${end.format('HH:mm')}`
                      : start.format('HH:mm');

                  return (
                    <p className="text-sm text-slate-900 font-medium">
                      {start.format('dddd, D MMMM YYYY')} · {timeLabel}
                    </p>
                  );
                })()}
              </div>
            </div>

            {selectedEvent.location && (
              <div className="flex items-start gap-3 mt-2 p-3 rounded-xl bg-slate-50">
                <span className="text-blue-500 shrink-0">📍</span>
                <div>
                  <p className="text-xs text-blue-600/50 uppercase tracking-wide">Location</p>
                  <p className="text-sm text-slate-900">{selectedEvent.location}</p>
                </div>
              </div>
            )}

            {selectedEvent.subject_id && (
              <div className="flex items-start gap-3 mt-2 p-3 rounded-xl bg-slate-50">
                <FiBookOpen className="text-blue-500 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-blue-600/50 uppercase tracking-wide">Related Subject</p>
                  <button
                    onClick={handleGoToSubject}
                    className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:underline"
                  >
                    {selectedEvent.subjects?.name || 'View Subject →'}
                  </button>
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-blue-600/50 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedEvent.description}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Day Events Modal (Mobile) */}
      {showDayModal && dayClickDate && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
            onClick={() => setShowDayModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[70] min-w-[280px] max-w-[360px] w-[calc(100%-2rem)] bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-300/50 p-5 -translate-x-1/2 -translate-y-1/2 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Events for {formatDateThai(dayClickDate.format('YYYY-MM-DD'))}
              </h2>
              <button
                onClick={() => setShowDayModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors shrink-0"
              >
                ×
              </button>
            </div>

            {dayEvents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No events on this day</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => {
                      setShowDayModal(false);
                      setSelectedEvent(ev);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2.5 w-full p-2.5 rounded-xl hover:bg-slate-50 transition text-left"
                  >
                    <div className={`w-2.5 h-8 rounded-full shrink-0 ${EVENT_TYPE_COLORS[ev.type] ?? 'bg-blue-500'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {ev.title}
                      </p>
                      <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full border ${EVENT_TYPE_BADGE[ev.type] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {getEventTypeLabel(ev.type)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
