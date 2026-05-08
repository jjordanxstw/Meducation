'use client';

/**
 * Calendar Section Component
 * Ant Design Calendar with custom event rendering and responsive mobile support
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Card, CardBody } from '@nextui-org/react';
import { Calendar } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { api } from '@/lib/api';
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

// Event type badge colors for modal
const EVENT_TYPE_BADGE: Record<string, string> = {
  exam: 'bg-red-500/20 text-red-300 border-red-500/30',
  lecture: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  holiday: 'bg-green-500/20 text-green-300 border-green-500/30',
  event: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export function CalendarSection() {
  const t = useTranslations('calendar');
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 639px)');

  // Single state: current calendar date (controls which month is shown)
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Day-click modal state (mobile)
  const [dayClickDate, setDayClickDate] = useState<Dayjs | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Derived month/year for dropdowns
  const selectedMonth = currentDate.month(); // 0-indexed
  const selectedYear = currentDate.year();

  // Month options
  const MONTH_LABELS = useMemo(() => ([
    t('months.january'),
    t('months.february'),
    t('months.march'),
    t('months.april'),
    t('months.may'),
    t('months.june'),
    t('months.july'),
    t('months.august'),
    t('months.september'),
    t('months.october'),
    t('months.november'),
    t('months.december'),
  ]), [t]);

  const WEEKDAY_LABELS = useMemo(() => ([
    t('weekdays.sunday'),
    t('weekdays.monday'),
    t('weekdays.tuesday'),
    t('weekdays.wednesday'),
    t('weekdays.thursday'),
    t('weekdays.friday'),
    t('weekdays.saturday'),
  ]), [t]);

  const ALL_MONTHS = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: MONTH_LABELS[i],
    }));
  }, [MONTH_LABELS]);

  const YEARS = useMemo(() => {
    const y = dayjs().year();
    return Array.from({ length: 5 }, (_, i) => y + i);
  }, []);

  // Date range for API (expanded ±1 month for smooth navigation)
  const dateRange = useMemo(() => ({
    start_date: currentDate.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
    end_date: currentDate.add(2, 'month').endOf('month').format('YYYY-MM-DD'),
  }), [currentDate]);

  // Fetch calendar events — always refetch on month change
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['calendar', dateRange],
    queryFn: () => api.calendar.list(dateRange),
    staleTime: 60 * 1000,
    refetchOnMount: false,
  });

  const events: (CalendarEvent & { subjects?: { name: string; code: string } })[] = useMemo(
    () => data?.data?.data ?? [],
    [data],
  );

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

  // Navigation — simple state updates, no refs or API calls
  const goToPrev = useCallback(() => setCurrentDate((d) => d.subtract(1, 'month')), []);
  const goToNext = useCallback(() => setCurrentDate((d) => d.add(1, 'month')), []);
  const goToToday = useCallback(() => setCurrentDate(dayjs()), []);

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
          isToday
            ? 'w-[26px] h-[26px] rounded-full bg-[#2563eb] text-white'
            : 'text-slate-500 dark:text-white/50'
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
              <span className="text-[11px] font-medium text-slate-700 dark:text-white/80 truncate leading-tight">
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

  // Filter options with i18n
  const filterOptions = [
    { key: 'all', label: t('allEvents') },
    { key: 'exam', label: t('exam') },
    { key: 'lecture', label: t('lecture') },
    { key: 'holiday', label: t('holiday') },
    { key: 'event', label: t('event') },
  ];

  return (
    <>
      {/* Navigation Row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('title')}
          </h2>
          <p className="text-sm text-slate-400 dark:text-white/40 mt-0.5">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-white/[0.08] border border-slate-200 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/80 transition"
            aria-label={t('previousMonth')}
          >
            <FiChevronLeft size={17} />
          </button>

          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-full text-sm font-semibold border hover:bg-slate-100 dark:hover:bg-white/10 transition min-w-[140px] text-center bg-white dark:bg-white/[0.08] border-slate-200 dark:border-white/20 text-slate-800 dark:text-white"
          >
            {currentMonthLabel}
          </button>

          <button
            onClick={goToNext}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-white/[0.08] border border-slate-200 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/80 transition"
            aria-label={t('nextMonth')}
          >
            <FiChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Month selector */}
        <PillDropdown
          ariaLabel={t('title')}
          value={selectedMonth}
          options={ALL_MONTHS.map((m) => ({ value: m.value, label: m.label }))}
          onChange={(value) => setCurrentDate((d) => d.month(Number(value)))}
        />

        {/* Year selector */}
        <PillDropdown
          ariaLabel={t('title')}
          value={selectedYear}
          options={YEARS.map((year) => ({ value: year, label: String(year) }))}
          onChange={(value) => setCurrentDate((d) => d.year(Number(value)))}
        />

        {/* Event type filter */}
        <PillDropdown
          ariaLabel={t('filterByType')}
          value={filterType}
          options={filterOptions.map((option) => ({
            value: option.key,
            label: option.key === 'all' ? t('filterByType') : `${t('filterByType')}: ${option.label}`,
          }))}
          onChange={setFilterType}
        />

        {/* Reset filters */}
        {filterType !== 'all' && (
          <button
            onClick={resetFilters}
            className="text-xs text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition"
          >
            <FiX size={12} /> {t('reset')}
          </button>
        )}

        {/* Event legend with colored dots */}
        <div className="flex flex-wrap items-center gap-3 ml-auto max-w-full sm:max-w-[58%] justify-start sm:justify-end">
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
                <h3 className="text-base font-semibold text-danger">{t('unableToLoad')}</h3>
                <p className="text-sm text-default-500 mt-1">{t('pleaseRetry')}</p>
              </div>
            </div>
            <button
              onClick={() => void refetch()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              <FiRefreshCw className="h-4 w-4" />
              {t('retry')}
            </button>
          </CardBody>
        </Card>
      ) : isLoading ? (
        <CalendarCardSkeleton />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm bg-white dark:bg-transparent">
          <div className="px-4 sm:px-6 pt-4">
            <div className="grid grid-cols-7 gap-0 border-b border-slate-200 dark:border-white/10 pb-3 text-center">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-white/40 whitespace-nowrap">
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
                <p className="text-xs text-blue-600/50 dark:text-blue-200/50 uppercase tracking-wide">{t('date')}</p>
                <p className="text-sm text-slate-900 dark:text-white font-medium">{formatDateThai(selectedEvent.start_date)}</p>
                {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('until')} {formatDateThai(selectedEvent.end_date)}</p>
                ) : null}
              </div>
            </div>

            {selectedEvent.location && (
              <div className="flex items-start gap-3 mt-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="text-blue-500 dark:text-blue-400 shrink-0">📍</span>
                <div>
                  <p className="text-xs text-blue-600/50 dark:text-blue-200/50 uppercase tracking-wide">{t('location')}</p>
                  <p className="text-sm text-slate-900 dark:text-white">{selectedEvent.location}</p>
                </div>
              </div>
            )}

            {selectedEvent.subject_id && (
              <div className="flex items-start gap-3 mt-2 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <FiBookOpen className="text-blue-500 dark:text-blue-400 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-blue-600/50 dark:text-blue-200/50 uppercase tracking-wide">{t('relatedSubject')}</p>
                  <button
                    onClick={handleGoToSubject}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline flex items-center gap-1"
                  >
                    {t('viewSubject')}
                  </button>
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <p className="text-xs text-blue-600/50 dark:text-blue-200/50 uppercase tracking-wide mb-1">{t('description')}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedEvent.description}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Day Events Modal (Mobile) */}
      {showDayModal && dayClickDate && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm dark:bg-black/40"
            onClick={() => setShowDayModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[70] min-w-[280px] max-w-[360px] w-[calc(100%-2rem)] bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-300/50 dark:shadow-black/70 p-5 -translate-x-1/2 -translate-y-1/2 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('eventsFor')} {formatDateThai(dayClickDate.format('YYYY-MM-DD'))}
              </h2>
              <button
                onClick={() => setShowDayModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white transition-colors shrink-0"
              >
                ×
              </button>
            </div>

            {dayEvents.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-white/40 text-center py-6">
                {t('noEvents')}
              </p>
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
                    className="flex items-center gap-2.5 w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition text-left"
                  >
                    <div className={`w-2.5 h-8 rounded-full shrink-0 ${EVENT_TYPE_COLORS[ev.type] ?? 'bg-blue-500'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {ev.title}
                      </p>
                      <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full border ${EVENT_TYPE_BADGE[ev.type] ?? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-white/70 dark:border-white/20'}`}>
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
