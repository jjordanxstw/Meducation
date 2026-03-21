'use client';

/**
 * FullCalendar Inner Component
 * Imports plugins statically as required
 */

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, ViewMountArg } from '@fullcalendar/core';

interface FullCalendarInnerProps {
  events: Record<string, unknown>[];
  onEventClick: (clickInfo: EventClickArg) => void;
  initialView?: string;
  onViewChange?: (view: string) => void;
}

export function FullCalendarInner({
  events,
  onEventClick,
  initialView = 'dayGridMonth',
  onViewChange,
}: FullCalendarInnerProps) {
  return (
    <div className="fc-custom overflow-x-auto">
      <div className="min-w-[680px] sm:min-w-0">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={initialView}
          headerToolbar={false}
          height="auto"
          aspectRatio={1.4}
          locale="en"
          events={events}
          eventClick={onEventClick}
          dayMaxEvents={3}
          moreLinkText={(n: number) => `+${n}`}
          nowIndicator
          selectable={false}
          eventDisplay="block"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          views={{
            dayGridMonth: {
              dayMaxEvents: 3,
            },
            timeGridWeek: {
              slotMinTime: '06:00:00',
              slotMaxTime: '22:00:00',
            },
            timeGridDay: {
              slotMinTime: '06:00:00',
              slotMaxTime: '22:00:00',
            },
          }}
          viewDidMount={(mountArg: ViewMountArg) => {
            onViewChange?.(mountArg.view.type);
          }}
        />
      </div>
    </div>
  );
}
