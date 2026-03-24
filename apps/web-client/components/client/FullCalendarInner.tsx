'use client';

/**
 * FullCalendar Inner Component
 * Imports plugins statically as required
 * Uses forwardRef to expose the calendar API
 */

import { forwardRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DatesSetArg } from '@fullcalendar/core';
import type { EventContentArg } from '@fullcalendar/core/index.js';

interface FullCalendarInnerProps {
  events: Record<string, unknown>[];
  onEventClick: (clickInfo: EventClickArg) => void;
  initialView?: string;
  onViewChange?: (view: string) => void;
  onDatesSet?: (dateInfo: DatesSetArg) => void;
  eventContent?: (eventInfo: EventContentArg) => React.ReactNode;
}

export const FullCalendarInner = forwardRef<unknown, FullCalendarInnerProps>((props, ref) => {
  return (
    <FullCalendar
      ref={ref as React.RefObject<FullCalendar> | null}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView={props.initialView || 'dayGridMonth'}
      events={props.events}
      eventClick={props.onEventClick}
      datesSet={props.onDatesSet}
      eventContent={props.eventContent}
      headerToolbar={false}
      height="auto"
    />
  );
});

FullCalendarInner.displayName = 'FullCalendarInner';
