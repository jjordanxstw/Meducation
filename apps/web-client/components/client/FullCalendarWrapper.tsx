'use client';

/**
 * FullCalendar Wrapper Component
 * Uses dynamic import with SSR disabled to avoid class constructor issues
 */

import dynamic from 'next/dynamic';
import type { EventClickArg } from '@fullcalendar/core';

interface FullCalendarWrapperProps {
  events: Record<string, unknown>[];
  onEventClick: (clickInfo: EventClickArg) => void;
  initialView?: string;
  onViewChange?: (view: string) => void;
}

// Loading component
function CalendarLoader() {
  return (
    <div className="card-flat flex flex-col items-center justify-center space-y-4 rounded-[var(--radius-lg)] py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" />
      <p className="text-[var(--ink-2)] text-sm">Loading calendar...</p>
    </div>
  );
}

// Dynamically import FullCalendar with SSR disabled
const FullCalendarComponent = dynamic(
  () => import('./FullCalendarInner').then((mod) => mod.FullCalendarInner),
  {
    ssr: false,
    loading: () => <CalendarLoader />,
  }
);

export function FullCalendarWrapper(props: FullCalendarWrapperProps) {
  return <FullCalendarComponent {...props} />;
}
