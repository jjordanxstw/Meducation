'use client';

/**
 * FullCalendar Wrapper Component
 * Dynamically imported with SSR disabled
 */

import { useEffect, useState } from 'react';
import type { EventClickArg } from '@fullcalendar/core';

interface FullCalendarWrapperProps {
  events: Record<string, unknown>[];
  onEventClick: (clickInfo: EventClickArg) => void;
}

export function FullCalendarWrapper({ events, onEventClick }: FullCalendarWrapperProps) {
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
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="text-medical-gray-500">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="fc-custom">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek',
        }}
        height="auto"
        aspectRatio={1.35}
        locale="en"
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week',
        }}
        events={events}
        eventClick={onEventClick}
        dayMaxEvents={3}
        moreLinkText={(n: number) => `+${n} more`}
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
        }}
      />
    </div>
  );
}
