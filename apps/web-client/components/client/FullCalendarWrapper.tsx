'use client';

/**
 * FullCalendar Wrapper Component
 * Dynamically imported with SSR disabled
 */

import { useEffect, useState } from 'react';
import type { EventClickArg, ViewApi } from '@fullcalendar/core';

interface FullCalendarWrapperProps {
  events: Record<string, unknown>[];
  onEventClick: (clickInfo: EventClickArg) => void;
  initialView?: string;
  onViewChange?: (view: string) => void;
}

export function FullCalendarWrapper({
  events,
  onEventClick,
  initialView = 'dayGridMonth',
  onViewChange,
}: FullCalendarWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [FullCalendar, setFullCalendar] = useState<any>(null);
  const [dayGridPlugin, setDayGridPlugin] = useState<any>(null);
  const [timeGridPlugin, setTimeGridPlugin] = useState<any>(null);
  const [interactionPlugin, setInteractionPlugin] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // Dynamically import FullCalendar only on client
    Promise.all([
      import('@fullcalendar/react'),
      import('@fullcalendar/daygrid'),
      import('@fullcalendar/timegrid'),
      import('@fullcalendar/interaction'),
    ]).then(([fcModule, dg, tg, ip]) => {
      setFullCalendar(fcModule.default);
      setDayGridPlugin(dg.default);
      setTimeGridPlugin(tg.default);
      setInteractionPlugin(ip.default);
    });
  }, []);

  if (!mounted || !FullCalendar || !dayGridPlugin || !timeGridPlugin || !interactionPlugin) {
    return (
      <div className="card-flat flex flex-col items-center justify-center space-y-4 rounded-[var(--radius-lg)] py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" />
        <p className="text-[var(--ink-2)] text-sm">Loading calendar...</p>
      </div>
    );
  }

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
          viewDidMount={(view: ViewApi) => {
            onViewChange?.(view.type);
          }}
        />
      </div>
    </div>
  );
}
