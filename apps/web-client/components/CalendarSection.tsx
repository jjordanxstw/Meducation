'use client';

/**
 * Calendar (Brilliant: Student Desktop / Calendar, Student Mobile / Calendar
 * agenda). Monday-first month grid with tinted event pills, legend chips that
 * filter by type, an Agenda view, and a side panel with today and the
 * upcoming exam countdowns.
 */

import type * as React from 'react';
import { useState, useMemo, useCallback, useSyncExternalStore } from 'react';
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
  BookOpen,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalendarCardSkeleton } from '@/components/skeletons/DashboardSkeletons';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUpcomingEvents } from '@/hooks/use-upcoming';

// Event type names + colors are admin-managed and arrive resolved on each event
// (`event.color`). Anything without a resolved color falls back to the brand.
const FALLBACK_COLOR = '#2f80ed';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type EventWithSubject = CalendarEvent & { subjects?: { name: string; code: string } };

const fmtTime = (t?: string | null) => (t ? t.slice(0, 5) : '');

/** "09:00 – 12:00" / "09:00" / "All day". */
function eventTimeLabel(event: CalendarEvent): string {
  if (!event.start_time) return 'All day';
  const start = fmtTime(event.start_time);
  const end = fmtTime(event.end_time);
  // Daily-schedule events repeat the same window every day — show just the window.
  if (event.daily_schedule) {
    return end ? `${start} – ${end}` : start;
  }
  // Cross-day timed event: spell out the dates so "14:00 – 03:30" isn't ambiguous.
  if (event.end_date && event.end_date !== event.start_date) {
    const sd = dayjs(event.start_date).format('D MMM');
    const ed = dayjs(event.end_date).format('D MMM');
    return end ? `${sd} ${start} → ${ed} ${end}` : `${sd} ${start} →`;
  }
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
      <p className="font-semibold text-ink-1 leading-thai">{event.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-3 tabular">
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
        {/* All-day events show their span here; timed multi-day events already
            carry the dates in their time label above. */}
        {!event.start_time && multiDay && end && (
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

const MIN_HOUR_WIDTH = 44; // floor px per hour before the track starts scrolling
const LANE_HEIGHT = 56; // px per stacked event row
const LANE_GAP = 8;

/**
 * Horizontal day timeline: an hour axis with timed events positioned by start
 * time and sized by duration. The track is fluid — it fills the modal width and
 * the hour columns shrink with it; only below a readable minimum width does it
 * start scrolling horizontally. Overlapping events stack into lanes.
 *
 * Cross-day events are clamped to the viewed day's 00:00–24:00 window: on the
 * start day they run from their start time to midnight (continues →), on the
 * end day from midnight to their end time (→ continued), with a full bar on any
 * day fully inside the span.
 */
function HorizontalDayTimeline({ day, events }: { day: Dayjs; events: EventWithSubject[] }) {
  if (events.length === 0) return null;
  const DAY_END = 24 * 60;

  const items = events.map((ev) => {
    // Daily-schedule events use their own start/end window on every day, so they
    // never "continue" across midnight — only continuous spans clamp to the day.
    const startsBeforeToday = !ev.daily_schedule && dayjs(ev.start_date).isBefore(day, 'day');
    const endsAfterToday = !ev.daily_schedule && !!ev.end_date && dayjs(ev.end_date).isAfter(day, 'day');

    const s = startsBeforeToday ? 0 : toMinutes(ev.start_time);
    let e = endsAfterToday
      ? DAY_END
      : ev.end_time
        ? toMinutes(ev.end_time)
        : startsBeforeToday
          ? DAY_END
          : s + 60;
    e = Math.max(e, s + 30); // keep a minimum renderable width
    e = Math.min(e, DAY_END);
    return { ev, s, e, contBefore: startsBeforeToday, contAfter: endsAfterToday };
  });

  const startHour = Math.floor(Math.min(...items.map((i) => i.s)) / 60);
  let endHour = Math.ceil(Math.max(...items.map((i) => i.e)) / 60);
  if (endHour - startHour < 3) endHour = startHour + 3; // keep a readable minimum span
  const hourCount = endHour - startHour;
  const winStart = startHour * 60;
  const span = hourCount * 60; // window width in minutes (positions are % of this)
  const minTrackWidth = hourCount * MIN_HOUR_WIDTH;
  const hourCells = Array.from({ length: hourCount }, (_, i) => startHour + i);

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
      {/* Fluid: fills the modal width; only scrolls once columns hit the floor. */}
      <div className="w-full" style={{ minWidth: minTrackWidth }}>
        {/* Hour axis — one label per hour column, left-aligned at its gridline */}
        <div className="mb-1 flex">
          {hourCells.map((h) => (
            <div key={h} className="min-w-0 flex-1 pl-1 text-[10px] font-medium tabular-nums text-ink-3">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Track */}
        <div className="relative rounded-xl border border-slate-200/70 bg-slate-50/40" style={{ height: trackHeight }}>
          {/* Hour gridlines (equal flex columns) */}
          <div className="absolute inset-0 flex" aria-hidden>
            {hourCells.map((h) => (
              <div key={h} className="min-w-0 flex-1 border-l border-slate-200/60 first:border-l-0" />
            ))}
          </div>

          {placed.map(({ ev, s, e, lane, contBefore, contAfter }) => {
            const color = ev.color || FALLBACK_COLOR;
            const leftPct = ((s - winStart) / span) * 100;
            const widthPct = ((e - s) / span) * 100;
            const top = 8 + lane * (LANE_HEIGHT + LANE_GAP);
            // Day-relative time text with continuation arrows for cross-day events.
            const timeText =
              contBefore && contAfter
                ? 'All day'
                : contBefore
                  ? fmtTime(ev.end_time)
                    ? `→ ${fmtTime(ev.end_time)}`
                    : 'continued'
                  : contAfter
                    ? `${fmtTime(ev.start_time)} →`
                    : eventTimeLabel(ev);
            return (
              <div
                key={ev.id}
                title={`${eventTimeLabel(ev)} · ${ev.title}`}
                className="absolute overflow-hidden rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-subtle"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  minWidth: 56,
                  top,
                  height: LANE_HEIGHT,
                  borderLeftWidth: 3,
                  borderLeftColor: color,
                }}
              >
                <p className="truncate text-xs font-semibold text-slate-800">{ev.title}</p>
                <p className="truncate text-[10px] tabular-nums text-slate-500">{timeText}</p>
                {ev.location && <p className="truncate text-[10px] text-ink-3">{ev.location}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type CalendarView = 'agenda' | 'month';

const noopSubscribe = () => () => undefined;

function readSavedView(): CalendarView | null {
  try {
    const saved = window.localStorage.getItem('medpi:calendar-view');
    return saved === 'agenda' || saved === 'month' ? saved : null;
  } catch {
    return null;
  }
}

/**
 * Agenda — the month in view as a list grouped by day (default on phones).
 * A multi-day event is listed once, on its first visible day, with its span.
 */
function AgendaList({
  events,
  monthStart,
  onSubject,
}: {
  events: EventWithSubject[];
  monthStart: Dayjs;
  onSubject: (subjectId: string) => void;
}) {
  const today = dayjs().startOf('day');
  const from = monthStart.isSame(today, 'month') ? today : monthStart.startOf('month');
  const fromStr = from.format('YYYY-MM-DD');
  const toStr = monthStart.endOf('month').format('YYYY-MM-DD');

  const byDay = new Map<string, EventWithSubject[]>();
  for (const event of events) {
    const start = event.start_date.split('T')[0];
    const end = (event.end_date ?? event.start_date).split('T')[0];
    if (end < fromStr || start > toStr) continue;
    const anchor = start < fromStr ? fromStr : start;
    byDay.set(anchor, [...(byDay.get(anchor) ?? []), event]);
  }
  const groups = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, dayEvents]) => [
      day,
      [...dayEvents].sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? '')),
    ] as const);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white py-14 text-center shadow-subtle">
        <Calendar className="h-12 w-12 text-brand/35" aria-hidden />
        <p className="text-base font-semibold text-ink-1">Nothing scheduled</p>
        <p className="text-sm text-ink-3">
          {monthStart.isSame(today, 'month') ? 'No more events this month.' : 'No events this month.'}
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-5">
      {groups.map(([day, dayEvents]) => {
        const date = dayjs(day);
        const diff = date.diff(today, 'day');
        const relative = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : null;
        return (
          <li key={day} className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-5">
            <div className="flex items-baseline gap-2 sm:block sm:pt-3">
              <p className={cn('text-sm font-semibold tabular', diff === 0 ? 'text-brand-hover' : 'text-ink-1')}>
                {date.format('ddd D MMM')}
              </p>
              {relative ? <p className="text-xs font-medium text-ink-3">{relative}</p> : null}
            </div>
            <ul className="space-y-2">
              {dayEvents.map((event) => (
                <li key={event.id}>
                  <EventDetailCard event={event} accent onSubject={onSubject} />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

/** Tinted pill colours from an event-type colour (admin-managed hex). */
function pillStyle(color: string, solid: boolean): React.CSSProperties {
  if (solid) return { backgroundColor: color, color: '#ffffff' };
  return {
    backgroundColor: `color-mix(in srgb, ${color} 14%, white)`,
    color: `color-mix(in srgb, ${color} 72%, black)`,
  };
}

function dayKey(date: Dayjs) {
  return date.format('YYYY-MM-DD');
}

export function CalendarSection() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 639px)');

  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [dayClickDate, setDayClickDate] = useState<Dayjs | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [view, setView] = useState<CalendarView | null>(null);
  const savedView = useSyncExternalStore(noopSubscribe, readSavedView, () => null);

  // Phones default to the agenda, larger screens to the month grid, until the
  // student picks one (remembered on this device).
  const effectiveView: CalendarView = view ?? savedView ?? (isMobile ? 'agenda' : 'month');
  const chooseView = (next: CalendarView) => {
    setView(next);
    try {
      window.localStorage.setItem('medpi:calendar-view', next);
    } catch {
      /* storage unavailable */
    }
  };

  const { data: events = [], isLoading, isError, isFetching, refetch } = useCalendarEvents(currentDate.format('YYYY-MM'));
  const { data: upcoming = [] } = useUpcomingEvents(30);

  const typeColor = useMemo(() => {
    const map: Record<string, string> = {};
    for (const event of [...events, ...upcoming]) {
      if (event.type && !map[event.type]) map[event.type] = event.color || FALLBACK_COLOR;
    }
    return map;
  }, [events, upcoming]);

  const legendTypes = useMemo(() => {
    const order = ['exam', 'lecture', 'holiday', 'event'];
    return Object.keys(typeColor).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    });
  }, [typeColor]);

  const toggleType = (type: string) =>
    setHiddenTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  const filteredEvents = useMemo(() => events.filter((event) => !hiddenTypes.has(event.type)), [events, hiddenTypes]);

  const getEventsForDate = useCallback(
    (dateStr: string) =>
      filteredEvents
        .filter((event) => {
          const start = event.start_date.split('T')[0];
          const end = (event.end_date ?? event.start_date).split('T')[0];
          return dateStr >= start && dateStr <= end;
        })
        .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? '')),
    [filteredEvents],
  );

  // Monday-first grid covering the whole month (5 or 6 weeks).
  const gridDays = useMemo(() => {
    const monthStart = currentDate.startOf('month');
    const offset = (monthStart.day() + 6) % 7;
    const weeks = Math.ceil((offset + monthStart.daysInMonth()) / 7);
    const start = monthStart.subtract(offset, 'day');
    return Array.from({ length: weeks * 7 }, (_, i) => start.add(i, 'day'));
  }, [currentDate]);

  const openDay = (date: Dayjs) => {
    setDayClickDate(date);
    setShowDayModal(true);
  };

  const goToSubject = (subjectId: string) => {
    router.push(`/subjects/${subjectId}`);
    setShowDayModal(false);
  };

  const dayEvents = useMemo(() => (dayClickDate ? getEventsForDate(dayKey(dayClickDate)) : []), [dayClickDate, getEventsForDate]);
  const allDayEvents = dayEvents.filter((event) => !event.start_time);
  const timedEvents = dayEvents.filter((event) => !!event.start_time);

  const today = dayjs();
  const todayKey = dayKey(today);
  const todayEvents = upcoming.filter((event) => event.start_date.slice(0, 10) <= todayKey && (event.end_date ?? event.start_date).slice(0, 10) >= todayKey);
  const exams = upcoming.filter((event) => event.type === 'exam').slice(0, 4);

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="mr-2 text-2xl font-semibold tracking-tight text-ink-1 sm:text-3xl">
            {MONTH_LABELS[currentDate.month()]} {currentDate.year()}
          </h1>
          <Button size="icon" variant="secondary" aria-label="Previous month" className="h-9 w-9" onClick={() => setCurrentDate((d) => d.subtract(1, 'month'))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button size="icon" variant="secondary" aria-label="Next month" className="h-9 w-9" onClick={() => setCurrentDate((d) => d.add(1, 'month'))}>
            <ChevronRight className="size-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setCurrentDate(dayjs())}>
            Today
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show event types">
            {legendTypes.map((type) => {
              const hidden = hiddenTypes.has(type);
              const color = typeColor[type] || FALLBACK_COLOR;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={!hidden}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold capitalize transition-colors',
                    hidden ? 'border-slate-200 bg-white text-ink-3 line-through' : 'border-transparent',
                  )}
                  style={hidden ? undefined : pillStyle(color, false)}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                  {type}
                </button>
              );
            })}
          </div>
          <div className="flex rounded-xl bg-slate-200/60 p-1" role="group" aria-label="Calendar view">
            {([
              { key: 'month', label: 'Month', icon: LayoutGrid },
              { key: 'agenda', label: 'Agenda', icon: List },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                aria-pressed={effectiveView === key}
                onClick={() => chooseView(key)}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors',
                  effectiveView === key ? 'bg-white font-semibold text-ink-1 shadow-subtle' : 'font-medium text-ink-2 hover:text-ink-1',
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:hidden" aria-hidden />
                <span className="sr-only sm:not-sr-only">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {isError ? (
            <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-subtle">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <RefreshCw className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-red-700">Couldn’t load the calendar</h3>
                  <p className="mt-1 text-sm text-ink-3">Check your connection and try again.</p>
                </div>
              </div>
              <Button className="mt-4 w-fit" onClick={() => void refetch()}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <CalendarCardSkeleton />
          ) : effectiveView === 'agenda' ? (
            <AgendaList events={filteredEvents} monthStart={currentDate} onSubject={goToSubject} />
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle">
              <DataFreshnessDot isFetching={isFetching && !isLoading} />
              <div className="grid grid-cols-7 border-b border-slate-200/70">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {gridDays.map((date) => {
                  const key = dayKey(date);
                  const inMonth = date.month() === currentDate.month();
                  const isToday = key === todayKey;
                  const weekend = date.day() === 0 || date.day() === 6;
                  const evts = getEventsForDate(key);
                  const tint = evts.find((event) => event.type === 'exam') ?? evts.find((event) => event.type === 'holiday');
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => openDay(date)}
                      aria-label={`${date.format('dddd D MMMM')}${evts.length ? `, ${evts.length} events` : ''}`}
                      className={cn(
                        'flex min-h-[64px] flex-col gap-1 border-b border-r border-slate-100 p-1.5 text-left transition-colors hover:bg-slate-50 sm:min-h-[104px] [&:nth-child(7n)]:border-r-0',
                        !inMonth && 'bg-slate-50/60',
                        weekend && inMonth && 'bg-slate-50/40',
                        isToday && 'bg-brand-subtle/60',
                      )}
                      style={tint && inMonth && !isToday ? { backgroundColor: `color-mix(in srgb, ${tint.color || FALLBACK_COLOR} 8%, white)` } : undefined}
                    >
                      <span
                        className={cn(
                          'inline-flex h-6 min-w-6 items-center justify-center self-start rounded-full px-1 text-[13px] font-semibold tabular',
                          isToday ? 'bg-brand text-white' : inMonth ? (tint?.type === 'exam' ? 'text-red-700' : 'text-ink-1') : 'text-ink-4',
                        )}
                      >
                        {date.date()}
                      </span>
                      {isMobile ? (
                        evts.length > 0 ? (
                          <span className="flex justify-center gap-0.5">
                            {[...new Set(evts.map((event) => event.type))].map((type) => (
                              <span key={type} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: typeColor[type] || FALLBACK_COLOR }} />
                            ))}
                          </span>
                        ) : null
                      ) : (
                        <span className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                          {evts.slice(0, 2).map((event) => (
                            <span
                              key={event.id}
                              className="truncate rounded px-1.5 py-0.5 text-[11px] font-semibold leading-tight"
                              style={pillStyle(event.color || FALLBACK_COLOR, event.type === 'exam')}
                            >
                              {event.title}
                              {event.start_time ? ` ${event.start_time.slice(0, 5)}` : ''}
                            </span>
                          ))}
                          {evts.length > 2 ? <span className="px-1 text-[10px] font-semibold text-brand-hover">+{evts.length - 2} more</span> : null}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside className="space-y-4" aria-label="Today and upcoming exams">
          <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-subtle">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-hover">Today · {today.format('ddd D MMM')}</p>
            {todayEvents.length === 0 ? (
              <p className="mt-2 text-sm text-ink-3">Nothing scheduled today.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {todayEvents.map((event) => (
                  <li key={event.id} className="border-l-2 pl-3" style={{ borderColor: event.color || FALLBACK_COLOR }}>
                    <p className="text-sm font-semibold text-ink-1">{event.title}</p>
                    {event.description ? <p className="line-clamp-1 text-xs text-ink-2">{event.description}</p> : null}
                    <p className="text-xs text-ink-3 tabular">{[eventTimeLabel(event), event.location].filter(Boolean).join(' · ')}</p>
                    {event.subject_id ? (
                      <button
                        type="button"
                        onClick={() => goToSubject(event.subject_id as string)}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-hover hover:text-brand"
                      >
                        <BookOpen className="h-3.5 w-3.5" aria-hidden />
                        Open subject
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {exams.length > 0 ? (
            <section className="rounded-2xl border border-red-200/70 bg-white p-4 shadow-subtle">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-red-700">Upcoming exams</p>
              <ul className="mt-2 divide-y divide-slate-100">
                {exams.map((exam, index) => {
                  const days = dayjs(exam.start_date.slice(0, 10)).startOf('day').diff(today.startOf('day'), 'day');
                  return (
                    <li key={exam.id} className="flex items-center gap-3 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink-1">{exam.title}</span>
                        <span className="block truncate text-xs text-ink-3">
                          {[dayjs(exam.start_date).format('ddd D MMM'), exam.location].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className={cn('text-lg font-bold tabular', index === 0 ? 'text-red-700' : 'text-ink-2')}>
                        {days === 0 ? 'Today' : `${days}d`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      {/* Day timeline — one click shows every event with full details */}
      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        <DialogContent className="flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-7xl flex-col gap-0 overflow-hidden p-0">
          {dayClickDate && (
            <>
              <DialogHeader className="shrink-0 border-b border-slate-200/70 px-6 py-4">
                <DialogTitle className="text-xl">{dayClickDate.format('dddd, D MMMM YYYY')}</DialogTitle>
                <DialogDescription className="sr-only">
                  Schedule and all-day events for {dayClickDate.format('dddd, D MMMM YYYY')}
                </DialogDescription>
              </DialogHeader>

              {dayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <Calendar className="h-12 w-12 text-brand/35" />
                  <p className="text-sm text-ink-3">No events on this day</p>
                </div>
              ) : (
                <div className="flex-1 space-y-7 overflow-y-auto px-6 py-5">
                  {allDayEvents.length > 0 && (
                    <section className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">All day · {allDayEvents.length}</p>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {allDayEvents.map((ev) => (
                          <EventDetailCard key={ev.id} event={ev} accent onSubject={goToSubject} />
                        ))}
                      </div>
                    </section>
                  )}
                  {timedEvents.length > 0 && (
                    <section className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">Schedule · {timedEvents.length}</p>
                      <HorizontalDayTimeline day={dayClickDate} events={timedEvents} />
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {timedEvents.map((ev) => (
                          <EventDetailCard key={ev.id} event={ev} accent onSubject={goToSubject} />
                        ))}
                      </div>
                    </section>
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
