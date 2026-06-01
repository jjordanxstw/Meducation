'use client';

/**
 * Calendar Section — Tailwind + Radix month grid (no Ant Design).
 * English-only, single light theme.
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useCalendarEvents } from '@/hooks/use-calendar';
import { DataFreshnessDot } from '@/components/ui/DataFreshnessDot';
import type { CalendarEvent } from '@medical-portal/shared';
import {
  RefreshCw,
  X,
  BookOpen,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { CalendarCardSkeleton } from '@/components/skeletons/DashboardSkeletons';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { PillDropdown } from '@/components/ui/PillDropdown';

// Event type names + colors are admin-managed and arrive resolved on each event
// (`event.color`). Anything without a resolved color falls back to the brand.
const FALLBACK_COLOR = '#2f80ed';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type EventWithSubject = CalendarEvent & { subjects?: { name: string; code: string } };

const fmtTime = (t?: string | null) => (t ? t.slice(0, 5) : '');

/** "09:00 – 12:00" / "09:00" / "All day". */
function eventTimeLabel(event: CalendarEvent): string {
  if (!event.start_time) return 'All day';
  const start = fmtTime(event.start_time);
  const end = fmtTime(event.end_time);
  return end ? `${start} – ${end}` : start;
}

/** Rich, self-contained event card — all details visible, no extra click. */
function EventDetailCard({
  event,
  accent,
  onSubject,
}: {
  event: EventWithSubject;
  accent?: boolean;
  onSubject: (subjectId: string) => void;
}) {
  const color = event.color || FALLBACK_COLOR;
  const start = dayjs(event.start_date);
  const end = event.end_date ? dayjs(event.end_date) : null;
  const multiDay = end ? !end.isSame(start, 'day') : false;

  return (
    <div
      className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-subtle"
      style={accent ? { borderLeftWidth: 4, borderLeftColor: color } : undefined}
    >
      <p className="font-semibold text-slate-900">{event.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          {event.type}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} /> {eventTimeLabel(event)}
        </span>
        {event.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {event.location}
          </span>
        )}
        {multiDay && end && (
          <span>
            {start.format('D MMM')} – {end.format('D MMM')}
          </span>
        )}
      </div>
      {event.subject_id && (
        <button
          type="button"
          onClick={() => onSubject(event.subject_id as string)}
          className="mt-2 inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand-subtle px-2.5 py-0.5 text-xs font-medium text-brand transition-colors hover:bg-brand/15"
        >
          <BookOpen size={12} /> {event.subjects?.name || 'View subject'}
        </button>
      )}
      {event.description && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{event.description}</p>
      )}
    </div>
  );
}

const toMinutes = (t?: string | null) => {
  if (!t) return 0;
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

const HOUR_WIDTH = 88; // px per hour on the axis
const LANE_HEIGHT = 56; // px per stacked event row
const LANE_GAP = 8;
const AXIS_PAD = 28; // gutter so first/last hour labels aren't clipped

/**
 * Horizontal day timeline: an hour axis with timed events positioned by start
 * time and sized by duration. Overlapping events stack into lanes so nothing
 * sits on top of another; the track scrolls horizontally on small screens.
 */
function HorizontalDayTimeline({ events }: { events: EventWithSubject[] }) {
  if (events.length === 0) return null;

  const items = events.map((ev) => {
    const s = toMinutes(ev.start_time);
    const e = Math.max(ev.end_time ? toMinutes(ev.end_time) : s + 60, s + 30);
    return { ev, s, e };
  });

  const startHour = Math.floor(Math.min(...items.map((i) => i.s)) / 60);
  let endHour = Math.ceil(Math.max(...items.map((i) => i.e)) / 60);
  if (endHour - startHour < 3) endHour = startHour + 3; // keep a readable minimum span
  const hourCount = endHour - startHour;
  const winStart = startHour * 60;
  const trackWidth = hourCount * HOUR_WIDTH;
  const containerWidth = trackWidth + AXIS_PAD * 2;
  const hours = Array.from({ length: hourCount + 1 }, (_, i) => startHour + i);

  // Greedy lane assignment (interval partitioning) so overlaps stack vertically.
  const laneEnds: number[] = [];
  const placed = [...items]
    .sort((a, b) => a.s - b.s)
    .map((it) => {
      let lane = laneEnds.findIndex((end) => end <= it.s);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = it.e;
      return { ...it, lane };
    });
  const laneCount = Math.max(1, laneEnds.length);
  const trackHeight = laneCount * LANE_HEIGHT + (laneCount - 1) * LANE_GAP + 16;

  return (
    <div className="overflow-x-auto pb-1">
      <div style={{ width: containerWidth }} className="min-w-full">
        {/* Hour axis */}
        <div className="relative mb-1 h-4">
          {hours.map((h) => (
            <span
              key={h}
              className="absolute -translate-x-1/2 text-[10px] font-medium tabular-nums text-slate-400"
              style={{ left: AXIS_PAD + (h - startHour) * HOUR_WIDTH }}
            >
              {String(h).padStart(2, '0')}:00
            </span>
          ))}
        </div>

        {/* Track */}
        <div className="relative rounded-xl border border-slate-200/70 bg-slate-50/40" style={{ height: trackHeight }}>
          {hours.map((h) => (
            <span
              key={h}
              className="absolute bottom-0 top-0 w-px bg-slate-200/70"
              style={{ left: AXIS_PAD + (h - startHour) * HOUR_WIDTH }}
              aria-hidden
            />
          ))}
          {placed.map(({ ev, s, e, lane }) => {
            const color = ev.color || FALLBACK_COLOR;
            const left = AXIS_PAD + ((s - winStart) / 60) * HOUR_WIDTH;
            const width = Math.max(((e - s) / 60) * HOUR_WIDTH, 60);
            const top = 8 + lane * (LANE_HEIGHT + LANE_GAP);
            return (
              <div
                key={ev.id}
                title={`${eventTimeLabel(ev)} · ${ev.title}`}
                className="absolute overflow-hidden rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-subtle"
                style={{ left, width, top, height: LANE_HEIGHT, borderLeftWidth: 3, borderLeftColor: color }}
              >
                <p className="truncate text-xs font-semibold text-slate-800">{ev.title}</p>
                <p className="truncate text-[10px] tabular-nums text-slate-500">{eventTimeLabel(ev)}</p>
                {ev.location && <p className="truncate text-[10px] text-slate-400">{ev.location}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CalendarSection() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 639px)');

  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [filterType, setFilterType] = useState<string>('all');
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

  // Type → color across all fetched events (the query window spans ±1 month, so
  // this also colors the leading/trailing days that spill into the grid).
  const typeColor = useMemo(() => {
    const map: Record<string, string> = {};
    events.forEach((e) => {
      if (e.type && !map[e.type]) map[e.type] = e.color || FALLBACK_COLOR;
    });
    return map;
  }, [events]);

  // Legend + filter options reflect only the month in view — otherwise adjacent
  // months (also fetched) would leak their types into an otherwise-empty month.
  const monthTypeNames = useMemo(() => {
    const monthStart = currentDate.startOf('month').format('YYYY-MM-DD');
    const monthEnd = currentDate.endOf('month').format('YYYY-MM-DD');
    const seen = new Set<string>();
    events.forEach((e) => {
      const start = e.start_date.split('T')[0];
      const end = (e.end_date ?? e.start_date).split('T')[0];
      if (e.type && start <= monthEnd && end >= monthStart) seen.add(e.type);
    });
    return [...seen];
  }, [events, currentDate]);

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

  const openDay = (date: Dayjs) => {
    setDayClickDate(date);
    setShowDayModal(true);
  };

  const goToSubject = (subjectId: string) => {
    router.push(`/subjects/${subjectId}`);
    setShowDayModal(false);
  };

  const dayEvents = useMemo(() => {
    if (!dayClickDate) return [];
    return getEventsForDate(dayClickDate.format('YYYY-MM-DD'));
  }, [dayClickDate, getEventsForDate]);

  // All-day first, then timed events ordered by start time — drives the agenda.
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay = dayEvents.filter((e) => !e.start_time);
    const timed = dayEvents
      .filter((e) => !!e.start_time)
      .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));
    return { allDayEvents: allDay, timedEvents: timed };
  }, [dayEvents]);

  const filterOptions = useMemo(
    () => [{ value: 'all', label: 'All Events' }, ...monthTypeNames.map((name) => ({ value: name, label: name }))],
    [monthTypeNames],
  );

  return (
    <>
      {/* Header: title + month navigation */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">Academic Calendar</h2>
          <p className="mt-0.5 text-sm text-slate-500">Exam schedules, lectures, and events</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="secondary"
            aria-label="Previous month"
            className="h-9 w-9 rounded-full text-slate-600"
            onClick={() => setCurrentDate((d) => d.subtract(1, 'month'))}
          >
            <ChevronLeft className="size-[17px]" />
          </Button>
          <button
            type="button"
            onClick={() => setCurrentDate(dayjs())}
            title="Jump to today"
            className="min-w-[150px] rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-800 transition hover:border-brand/40 hover:bg-brand-subtle hover:text-brand"
          >
            {currentMonthLabel}
          </button>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Next month"
            className="h-9 w-9 rounded-full text-slate-600"
            onClick={() => setCurrentDate((d) => d.add(1, 'month'))}
          >
            <ChevronRight className="size-[17px]" />
          </Button>
        </div>
      </div>

      {/* Controls: month/year/type filters (left) + legend (right) */}
      <div className="mb-5 flex flex-col gap-3 border-t border-slate-200/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
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
              <X size={12} /> Reset
            </button>
          )}
        </div>

        {/* Legend — only the types present in the month in view */}
        {monthTypeNames.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {monthTypeNames.map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: typeColor[type] || FALLBACK_COLOR }}
                />
                <span className="text-sm text-slate-600">{type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar grid */}
      {isError ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-subtle">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
              <RefreshCw className="text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-600">Unable to load calendar events</h3>
              <p className="mt-1 text-sm text-slate-500">Please retry to load your calendar.</p>
            </div>
          </div>
          <Button className="mt-4 w-fit" onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4" />
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
                          <span
                            key={type}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: typeColor[type] || FALLBACK_COLOR }}
                          />
                        ))}
                      </span>
                    )
                  ) : (
                    <span className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                      {dayEvts.slice(0, 3).map((ev) => (
                        <span key={ev.id} className="flex items-center gap-1.5 truncate">
                          <span
                            className="h-3 w-[3px] shrink-0 rounded-full"
                            style={{ backgroundColor: ev.color || FALLBACK_COLOR }}
                          />
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
              <Calendar className="h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-400">No events this month</p>
            </div>
          )}
        </div>
      )}

      {/* Day timeline — one click shows every event with full details */}
      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {dayClickDate && (
            <>
              <DialogHeader>
                <DialogTitle>{dayClickDate.format('dddd, D MMMM YYYY')}</DialogTitle>
                <DialogDescription className="sr-only">
                  Schedule and all-day events for {dayClickDate.format('dddd, D MMMM YYYY')}
                </DialogDescription>
              </DialogHeader>

              {dayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <Calendar className="h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-400">No events on this day</p>
                </div>
              ) : (
                <div className="mt-1 space-y-5">
                  {allDayEvents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">All day</p>
                      {allDayEvents.map((ev) => (
                        <EventDetailCard key={ev.id} event={ev} accent onSubject={goToSubject} />
                      ))}
                    </div>
                  )}

                  {timedEvents.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Schedule</p>
                      {/* Horizontal timeline overview */}
                      <HorizontalDayTimeline events={timedEvents} />
                      {/* Full detail cards — every event's info without extra clicks */}
                      <div className="space-y-2">
                        {timedEvents.map((ev) => (
                          <EventDetailCard key={ev.id} event={ev} accent onSubject={goToSubject} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
