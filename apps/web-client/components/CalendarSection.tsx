'use client';

/**
 * Calendar Section — pure HeroUI + Tailwind month grid (no Ant Design).
 * English-only, single light theme.
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@heroui/react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useCalendarEvents } from '@/hooks/use-calendar';
import { DataFreshnessDot } from '@/components/ui/DataFreshnessDot';
import { formatDateThai, getEventTypeLabel, EventType } from '@medical-portal/shared';
import type { CalendarEvent } from '@medical-portal/shared';
import {
  FiRefreshCw,
  FiX,
  FiBookOpen,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
} from 'react-icons/fi';
import { CalendarCardSkeleton } from '@/components/skeletons/DashboardSkeletons';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { PillDropdown } from '@/components/ui/PillDropdown';

// Solid dot/bar color per event type (functional status colors).
const EVENT_TYPE_DOT: Record<string, string> = {
  exam: 'bg-red-500',
  lecture: 'bg-brand',
  holiday: 'bg-emerald-500',
  event: 'bg-purple-500',
};

const EVENT_TYPE_BADGE: Record<string, string> = {
  exam: 'bg-red-50 text-red-600 border-red-200',
  lecture: 'bg-brand-subtle text-brand border-brand/20',
  holiday: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  event: 'bg-purple-50 text-purple-600 border-purple-200',
};

const EVENT_TYPE_HEX: Record<string, string> = {
  exam: '#ef4444',
  lecture: '#2f80ed',
  holiday: '#10b981',
  event: '#a855f7',
};

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function hasTime(value: string): boolean {
  return /T\d{2}:\d{2}/.test(value) && !/T00:00(:00)?/.test(value);
}

type EventWithSubject = CalendarEvent & { subjects?: { name: string; code: string } };

export function CalendarSection() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 639px)');

  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventWithSubject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dayClickDate, setDayClickDate] = useState<Dayjs | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const selectedMonth = currentDate.month();
  const selectedYear = currentDate.year();

  const ALL_MONTHS = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ value: i, label: MONTH_LABELS[i] })),
    [],
  );
  const YEARS = useMemo(() => {
    const y = dayjs().year();
    return Array.from({ length: 5 }, (_, i) => y + i);
  }, []);

  const {
    data: events = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useCalendarEvents(currentDate.format('YYYY-MM'));

  const filteredEvents = useMemo(
    () => events.filter((event) => filterType === 'all' || event.type === filterType),
    [events, filterType],
  );

  const getEventsForDate = useCallback(
    (dateStr: string) =>
      filteredEvents.filter((ev) => {
        const start = ev.start_date.split('T')[0];
        const end = (ev.end_date ?? ev.start_date).split('T')[0];
        return dateStr >= start && dateStr <= end;
      }),
    [filteredEvents],
  );

  // Build the 6-week grid (42 cells) covering the current month.
  const gridDays = useMemo(() => {
    const start = currentDate.startOf('month').startOf('week');
    return Array.from({ length: 42 }, (_, i) => start.add(i, 'day'));
  }, [currentDate]);

  const monthHasEvents = useMemo(() => {
    const m = currentDate.format('YYYY-MM');
    return filteredEvents.some((ev) => {
      const start = ev.start_date.slice(0, 7);
      const end = (ev.end_date ?? ev.start_date).slice(0, 7);
      return start <= m && m <= end;
    });
  }, [filteredEvents, currentDate]);

  const currentMonthLabel = `${MONTH_LABELS[selectedMonth]} ${selectedYear}`;

  const openEvent = (ev: EventWithSubject) => {
    setSelectedEvent(ev);
    setIsModalOpen(true);
  };

  const openDay = (date: Dayjs) => {
    setDayClickDate(date);
    setShowDayModal(true);
  };

  const handleGoToSubject = () => {
    if (selectedEvent?.subject_id) {
      router.push(`/subjects/${selectedEvent.subject_id}`);
      setIsModalOpen(false);
    }
  };

  const dayEvents = useMemo(() => {
    if (!dayClickDate) return [];
    return getEventsForDate(dayClickDate.format('YYYY-MM-DD'));
  }, [dayClickDate, getEventsForDate]);

  const filterOptions = [
    { value: 'all', label: 'All Events' },
    { value: 'exam', label: 'Exam' },
    { value: 'lecture', label: 'Lecture' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'event', label: 'Event' },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">Academic Calendar</h2>
          <p className="mt-0.5 text-sm text-slate-500">Exam schedules, lectures, and events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="bordered"
            radius="full"
            aria-label="Previous month"
            className="border-slate-200 text-slate-600"
            onPress={() => setCurrentDate((d) => d.subtract(1, 'month'))}
          >
            <FiChevronLeft size={17} />
          </Button>
          <button
            type="button"
            onClick={() => setCurrentDate(dayjs())}
            className="min-w-[150px] rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-800 transition hover:border-brand/40 hover:bg-brand-subtle hover:text-brand"
          >
            {currentMonthLabel}
          </button>
          <Button
            isIconOnly
            size="sm"
            variant="bordered"
            radius="full"
            aria-label="Next month"
            className="border-slate-200 text-slate-600"
            onPress={() => setCurrentDate((d) => d.add(1, 'month'))}
          >
            <FiChevronRight size={17} />
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <PillDropdown
          ariaLabel="Select month"
          value={selectedMonth}
          options={ALL_MONTHS.map((m) => ({ value: m.value, label: m.label }))}
          onChange={(value) => setCurrentDate((d) => d.month(Number(value)))}
        />
        <PillDropdown
          ariaLabel="Select year"
          value={selectedYear}
          options={YEARS.map((year) => ({ value: year, label: String(year) }))}
          onChange={(value) => setCurrentDate((d) => d.year(Number(value)))}
        />
        <PillDropdown
          ariaLabel="Filter by type"
          value={filterType}
          options={filterOptions.map((o) => ({
            value: o.value,
            label: o.value === 'all' ? 'Filter by type' : `Type: ${o.label}`,
          }))}
          onChange={setFilterType}
        />
        {filterType !== 'all' && (
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className="flex items-center gap-1 text-xs text-slate-400 transition hover:text-red-500"
          >
            <FiX size={12} /> Reset
          </button>
        )}

        {/* Legend */}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {Object.values(EventType).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${EVENT_TYPE_DOT[type] ?? 'bg-brand'}`} />
              <span className="text-sm text-slate-600">{getEventTypeLabel(type)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      {isError ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-subtle">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
              <FiRefreshCw className="text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-600">Unable to load calendar events</h3>
              <p className="mt-1 text-sm text-slate-500">Please retry to load your calendar.</p>
            </div>
          </div>
          <Button color="primary" className="mt-4 w-fit" startContent={<FiRefreshCw className="h-4 w-4" />} onPress={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <CalendarCardSkeleton />
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle">
          <DataFreshnessDot isFetching={isFetching && !isLoading} />

          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b border-slate-200/70 bg-slate-50/70">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {gridDays.map((date) => {
              const dateStr = date.format('YYYY-MM-DD');
              const inMonth = date.month() === selectedMonth;
              const isToday = date.isSame(dayjs(), 'day');
              const dayEvts = getEventsForDate(dateStr);
              const uniqueTypes = [...new Set(dayEvts.map((e) => e.type))];

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => openDay(date)}
                  className={`flex flex-col gap-1 border-b border-r border-slate-100 p-1.5 text-left transition-colors last:border-r-0 hover:bg-brand-subtle/60 sm:min-h-[104px] ${
                    inMonth ? '' : 'bg-slate-50/40 opacity-50'
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center text-[13px] font-medium ${
                      isToday ? 'rounded-full bg-brand text-white' : 'text-slate-600'
                    }`}
                  >
                    {date.date()}
                  </span>

                  {/* Mobile: dots. Desktop: event bars. */}
                  {isMobile ? (
                    uniqueTypes.length > 0 && (
                      <span className="flex justify-center gap-0.5">
                        {uniqueTypes.map((type) => (
                          <span key={type} className={`h-1.5 w-1.5 rounded-full ${EVENT_TYPE_DOT[type] ?? 'bg-brand'}`} />
                        ))}
                      </span>
                    )
                  ) : (
                    <span className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                      {dayEvts.slice(0, 3).map((ev) => (
                        <span key={ev.id} className="flex items-center gap-1.5 truncate">
                          <span className={`h-3 w-[3px] shrink-0 rounded-full ${EVENT_TYPE_DOT[ev.type] ?? 'bg-brand'}`} />
                          <span className="truncate text-[11px] font-medium leading-tight text-slate-700">{ev.title}</span>
                        </span>
                      ))}
                      {dayEvts.length > 3 && (
                        <span className="px-1 text-[10px] font-semibold text-brand">+{dayEvts.length - 3} more</span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!monthHasEvents && (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <FiCalendar className="h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-400">No events this month</p>
            </div>
          )}
        </div>
      )}

      {/* Event detail modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} placement="center" size="md">
        <ModalContent>
          {selectedEvent && (
            <>
              <ModalHeader className="flex-col items-start gap-2">
                <div
                  className="border-l-4 pl-3"
                  style={{ borderColor: selectedEvent.color || EVENT_TYPE_HEX[selectedEvent.type] || '#2f80ed' }}
                >
                  <h2 className="line-clamp-2 font-serif text-xl font-semibold tracking-tight text-slate-900">{selectedEvent.title}</h2>
                  <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs ${EVENT_TYPE_BADGE[selectedEvent.type] || 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                    {getEventTypeLabel(selectedEvent.type)}
                  </span>
                </div>
              </ModalHeader>
              <ModalBody className="gap-2 pb-6">
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                  <FiCalendar className="mt-0.5 shrink-0 text-brand" size={16} />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-brand/70">Date</p>
                    {(() => {
                      const start = dayjs(selectedEvent.start_date);
                      const end = selectedEvent.end_date ? dayjs(selectedEvent.end_date) : null;
                      const timed = hasTime(selectedEvent.start_date);
                      const multiDay = end ? !end.isSame(start, 'day') : false;
                      if (multiDay && end) {
                        return (
                          <p className="text-sm font-medium text-slate-900">
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
                        <p className="text-sm font-medium text-slate-900">
                          {start.format('dddd, D MMMM YYYY')} · {timeLabel}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                    <FiMapPin className="mt-0.5 shrink-0 text-brand" size={16} />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-brand/70">Location</p>
                      <p className="text-sm text-slate-900">{selectedEvent.location}</p>
                    </div>
                  </div>
                )}

                {selectedEvent.subject_id && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                    <FiBookOpen className="mt-0.5 shrink-0 text-brand" size={16} />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-brand/70">Related Subject</p>
                      <button
                        type="button"
                        onClick={handleGoToSubject}
                        className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand-subtle px-2.5 py-0.5 text-sm font-medium text-brand transition-colors hover:bg-brand/15"
                      >
                        {selectedEvent.subjects?.name || 'View Subject →'}
                      </button>
                    </div>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-brand/70">Description</p>
                    <p className="text-sm leading-relaxed text-slate-600">{selectedEvent.description}</p>
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Day events modal */}
      <Modal isOpen={showDayModal} onClose={() => setShowDayModal(false)} placement="center" size="sm" scrollBehavior="inside">
        <ModalContent>
          {dayClickDate && (
            <>
              <ModalHeader>
                <h2 className="font-serif text-lg font-semibold tracking-tight text-slate-900">
                  Events for {formatDateThai(dayClickDate.format('YYYY-MM-DD'))}
                </h2>
              </ModalHeader>
              <ModalBody className="pb-6">
                {dayEvents.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No events on this day</p>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => {
                          setShowDayModal(false);
                          openEvent(ev);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition hover:bg-slate-50"
                      >
                        <span className={`h-8 w-2.5 shrink-0 rounded-full ${EVENT_TYPE_DOT[ev.type] ?? 'bg-brand'}`} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{ev.title}</p>
                          <span className={`inline-block rounded-full border px-1.5 py-0.5 text-[10px] ${EVENT_TYPE_BADGE[ev.type] ?? 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                            {getEventTypeLabel(ev.type)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
