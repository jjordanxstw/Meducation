'use client';

/**
 * Calendar Page with FullCalendar Integration
 * Next.js adapted version
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  useDisclosure,
  Select,
  SelectItem,
  Divider,
} from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import type { EventClickArg } from '@fullcalendar/core';
import { api } from '@/lib/api';
import {
  formatDateTime,
  getEventTypeColor,
  getEventTypeLabel,
  EventType,
} from '@medical-portal/shared';
import type { CalendarEvent } from '@medical-portal/shared';
import { FiClock, FiMapPin, FiBook, FiInfo, FiRefreshCw, FiCalendar, FiList } from 'react-icons/fi';
import { FullCalendarWrapper } from '@/components/client/FullCalendarWrapper';
import { CalendarCardSkeleton } from '@/components/skeletons/DashboardSkeletons';

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

const VIEW_OPTIONS: { key: CalendarView; label: string; icon: React.ReactNode }[] = [
  { key: 'dayGridMonth', label: 'Month', icon: <FiCalendar className="h-4 w-4" /> },
  { key: 'timeGridWeek', label: 'Week', icon: <FiList className="h-4 w-4" /> },
  { key: 'timeGridDay', label: 'Day', icon: <FiClock className="h-4 w-4" /> },
];

export default function CalendarPage() {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [currentView, setCurrentView] = useState<CalendarView>('dayGridMonth');

  // Get current date range for the calendar (3 months range)
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  }, []);

  // Fetch calendar events
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['calendar', dateRange],
    queryFn: () => api.calendar.list(dateRange),
  });

  const events: (CalendarEvent & { subjects?: { name: string; code: string } })[] = useMemo(
    () => data?.data?.data ?? [],
    [data],
  );

  // Filter events by type
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter((event) => event.type === filterType);
  }, [events, filterType]);

  // Convert to FullCalendar format
  const calendarEvents = useMemo(() => {
    return filteredEvents.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start_time,
      end: event.end_time,
      allDay: event.is_all_day,
      backgroundColor: getEventTypeColor(event.type),
      borderColor: getEventTypeColor(event.type),
      extendedProps: {
        ...event,
      },
    }));
  }, [filteredEvents]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event.extendedProps as CalendarEvent;
    setSelectedEvent({
      ...event,
      id: clickInfo.event.id,
      title: clickInfo.event.title,
    });
    onOpen();
  };

  const handleGoToSubject = () => {
    if (selectedEvent?.subject_id) {
      router.push(`/subjects/${selectedEvent.subject_id}`);
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink-1)]">Academic Calendar</h1>
            <p className="text-base text-[var(--ink-2)]">Exam schedules, lectures, and events</p>
          </div>

          <Select
            label="Filter by type"
            selectedKeys={[filterType]}
            onSelectionChange={(keys) => setFilterType(Array.from(keys)[0] as string)}
            className="w-full sm:w-44"
            classNames={{
              label: 'text-sm',
              trigger: 'h-10',
            }}
          >
            <SelectItem key="all">All</SelectItem>
            <SelectItem key="exam">Exam</SelectItem>
            <SelectItem key="lecture">Lecture</SelectItem>
            <SelectItem key="holiday">Holiday</SelectItem>
            <SelectItem key="event">Event</SelectItem>
          </Select>
        </div>

        {/* Legend and View Switcher */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {Object.values(EventType).map((type) => (
              <Chip
                key={type}
                variant="flat"
                size="sm"
                style={{
                  backgroundColor: `${getEventTypeColor(type)}15`,
                  color: getEventTypeColor(type),
                }}
              >
                {getEventTypeLabel(type)}
              </Chip>
            ))}
          </div>

          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
            {VIEW_OPTIONS.map((option) => (
              <Button
                key={option.key}
                size="sm"
                variant="flat"
                className={`btn-precise justify-center px-2 sm:px-3 ${currentView === option.key ? 'bg-primary-100 text-primary' : ''}`}
                startContent={<span className="icon-with-text">{option.icon}</span>}
                onPress={() => setCurrentView(option.key)}
              >
                <span className="truncate">{option.label}</span>
              </Button>
            ))}
          </div>
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
            <Button
              color="primary"
              variant="flat"
              className="btn-precise"
              startContent={<span className="icon-with-text"><FiRefreshCw className="h-4 w-4" /></span>}
              onPress={() => void refetch()}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      ) : isLoading ? (
        <CalendarCardSkeleton />
      ) : (
        <Card className="glass-surface">
          <CardBody className="p-4 sm:p-6">
            <FullCalendarWrapper
              events={calendarEvents}
              onEventClick={handleEventClick}
              initialView={currentView}
              onViewChange={(view) => setCurrentView(view as CalendarView)}
            />
          </CardBody>
        </Card>
      )}

      {/* Event Detail Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: 'card-flat',
          header: 'pb-0 pt-6 px-6',
          body: 'py-6 px-6',
          footer: 'pb-6 pt-0 px-6',
        }}
      >
        <ModalContent>
          {selectedEvent && (
            <>
              <ModalHeader>
                <div className="flex items-start gap-3 w-full">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full mt-1"
                    style={{ backgroundColor: getEventTypeColor(selectedEvent.type) }}
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold line-clamp-2">
                      {selectedEvent.title}
                    </h2>
                    <Chip
                      size="sm"
                      variant="flat"
                      className="mt-2"
                      style={{
                        backgroundColor: `${getEventTypeColor(selectedEvent.type)}15`,
                        color: getEventTypeColor(selectedEvent.type),
                      }}
                    >
                      {getEventTypeLabel(selectedEvent.type)}
                    </Chip>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody>
                <div className="flex flex-col gap-3">
                  {/* Time */}
                  <div className="card-flat-hover flex items-start gap-3 rounded-[var(--radius-md)] p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FiClock className="text-primary h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-default-500 mb-1">Date & Time</p>
                      <p className="font-medium text-foreground line-clamp-2">
                        {formatDateTime(selectedEvent.start_time)}
                      </p>
                      {!selectedEvent.is_all_day && (
                        <p className="text-sm text-default-500 mt-1 line-clamp-2">
                          Until {formatDateTime(selectedEvent.end_time)}
                        </p>
                      )}
                      {selectedEvent.is_all_day && (
                        <p className="text-sm text-default-500 mt-1">All Day Event</p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {selectedEvent.location && (
                    <div className="card-flat-hover flex items-start gap-3 rounded-[var(--radius-md)] p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger/10">
                        <FiMapPin className="text-danger h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-default-500 mb-1">Location</p>
                        <p className="font-medium text-foreground line-clamp-2">{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}

                  <Divider />

                  {/* Subject */}
                  {selectedEvent.subject_id && (
                    <div className="card-flat-hover flex items-start gap-3 rounded-[var(--radius-md)] p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FiBook className="text-primary h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-default-500 mb-2">Related Subject</p>
                        <Button
                          color="primary"
                          variant="flat"
                          size="sm"
                          className="btn-precise"
                          onPress={handleGoToSubject}
                        >
                          View Subject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedEvent.description && (
                    <div className="card-flat-hover flex items-start gap-3 rounded-[var(--radius-md)] p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                        <FiInfo className="text-success h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-default-500 mb-2">Description</p>
                        <p className="text-sm text-default-600 leading-relaxed">{selectedEvent.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="light"
                  className="btn-precise"
                  onPress={onClose}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
