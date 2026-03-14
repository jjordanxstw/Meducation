import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Calendar Page with FullCalendar Integration
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Chip, useDisclosure, Select, SelectItem, } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { api } from '../lib/api';
import { formatDateTime, getEventTypeColor, getEventTypeLabel, EventType, } from '@medical-portal/shared';
import { FiClock, FiMapPin, FiBook, FiInfo } from 'react-icons/fi';
export default function CalendarPage() {
    const navigate = useNavigate();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filterType, setFilterType] = useState('all');
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
    const { data, isLoading } = useQuery({
        queryKey: ['calendar', dateRange],
        queryFn: () => api.calendar.list(dateRange),
    });
    const events = data?.data?.data || [];
    // Filter events by type
    const filteredEvents = useMemo(() => {
        if (filterType === 'all')
            return events;
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
    const handleEventClick = (clickInfo) => {
        const event = clickInfo.event.extendedProps;
        setSelectedEvent({
            ...event,
            id: clickInfo.event.id,
            title: clickInfo.event.title,
        });
        onOpen();
    };
    const handleGoToSubject = () => {
        if (selectedEvent?.subject_id) {
            navigate(`/subjects/${selectedEvent.subject_id}`);
            onClose();
        }
    };
    return (_jsxs("div", { className: "space-y-6 sm:space-y-8 animate-fade-in", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("h1", { className: "font-heading text-2xl sm:text-3xl font-bold text-medical-gray-900 mb-1 sm:mb-2", children: "Academic Calendar" }), _jsx("p", { className: "text-medical-gray-500 text-base sm:text-lg", children: "Exam schedules, lectures, and events" })] }), _jsxs(Select, { "aria-label": "Select event type", selectedKeys: [filterType], onChange: (e) => setFilterType(e.target.value), className: "w-full sm:w-36", size: "md", classNames: {
                            trigger: 'rounded-xl h-11 sm:h-12 shadow-sm',
                            label: 'text-xs sm:text-sm font-bold',
                            value: 'text-sm sm:text-base font-bold',
                        }, children: [_jsx(SelectItem, { children: "All" }, "all"), _jsx(SelectItem, { children: "Exam" }, "exam"), _jsx(SelectItem, { children: "Lecture" }, "lecture"), _jsx(SelectItem, { children: "Holiday" }, "holiday"), _jsx(SelectItem, { children: "Event" }, "event")] })] }), _jsx("div", { className: "flex flex-wrap gap-2 sm:gap-3", children: Object.values(EventType).map((type) => (_jsx(Chip, { variant: "flat", size: "sm", className: "rounded-lg font-medium px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm text-xs sm:text-sm", style: {
                        backgroundColor: `${getEventTypeColor(type)}15`,
                        color: getEventTypeColor(type),
                        border: `1px solid ${getEventTypeColor(type)}30`,
                    }, children: getEventTypeLabel(type) }, type))) }), _jsx(Card, { className: "card-rounded shadow-xl border-0 overflow-hidden", children: _jsx(CardBody, { className: "p-3 sm:p-4 md:p-6 lg:p-8", children: _jsx("div", { className: "fc-custom", children: _jsx(FullCalendar, { plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin], initialView: "dayGridMonth", headerToolbar: {
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek',
                            }, height: "auto", aspectRatio: 1.35, locale: "en", buttonText: {
                                today: 'Today',
                                month: 'Month',
                                week: 'Week',
                            }, events: calendarEvents, eventClick: handleEventClick, dayMaxEvents: 3, moreLinkText: (n) => `+${n} more`, nowIndicator: true, selectable: false, eventDisplay: "block", eventTimeFormat: {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            }, views: {
                                dayGridMonth: {
                                    dayMaxEvents: 3,
                                },
                                timeGridWeek: {
                                    slotMinTime: '06:00:00',
                                    slotMaxTime: '22:00:00',
                                },
                            } }) }) }) }), _jsx(Modal, { isOpen: isOpen, onClose: onClose, size: "2xl", scrollBehavior: "inside", placement: "center", classNames: {
                    base: "border-0 shadow-2xl m-2 sm:m-4",
                    wrapper: "p-2 sm:p-4",
                    header: "border-b border-medical-gray-200 pb-3 sm:pb-4 px-4 sm:px-6",
                    body: "py-4 sm:py-6 px-4 sm:px-6",
                    footer: "border-t border-medical-gray-200 pt-3 sm:pt-4 px-4 sm:px-6"
                }, children: _jsx(ModalContent, { children: selectedEvent && (_jsxs(_Fragment, { children: [_jsx(ModalHeader, { className: "flex flex-col gap-2 sm:gap-3 pt-4 sm:pt-6", children: _jsxs("div", { className: "flex items-start gap-3 sm:gap-4", children: [_jsx("div", { className: "w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 mt-1 shadow-sm", style: { backgroundColor: getEventTypeColor(selectedEvent.type) } }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h2", { className: "font-heading text-xl sm:text-2xl font-bold text-medical-gray-900 mb-2 break-words", children: selectedEvent.title }), _jsx(Chip, { size: "sm", variant: "flat", className: "font-semibold px-2.5 sm:px-3 py-1 text-xs sm:text-sm", style: {
                                                        backgroundColor: `${getEventTypeColor(selectedEvent.type)}15`,
                                                        color: getEventTypeColor(selectedEvent.type),
                                                        border: `1px solid ${getEventTypeColor(selectedEvent.type)}30`,
                                                    }, children: getEventTypeLabel(selectedEvent.type) })] })] }) }), _jsx(ModalBody, { children: _jsxs("div", { className: "space-y-4 sm:space-y-6", children: [_jsxs("div", { className: "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-medical-gray-50 rounded-xl", children: [_jsx("div", { className: "w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 shadow-sm", children: _jsx(FiClock, { className: "w-5 h-5 sm:w-6 sm:h-6 text-primary-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs sm:text-sm font-semibold text-medical-gray-500 mb-1", children: "Date & Time" }), _jsx("p", { className: "font-semibold text-medical-gray-900 text-base sm:text-lg break-words", children: formatDateTime(selectedEvent.start_time) }), !selectedEvent.is_all_day && (_jsxs("p", { className: "text-xs sm:text-sm text-medical-gray-600 mt-1 break-words", children: ["Until ", formatDateTime(selectedEvent.end_time)] })), selectedEvent.is_all_day && (_jsx("p", { className: "text-xs sm:text-sm text-medical-gray-600 mt-1", children: "All Day Event" }))] })] }), selectedEvent.location && (_jsxs("div", { className: "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-medical-gray-50 rounded-xl", children: [_jsx("div", { className: "w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 shadow-sm", children: _jsx(FiMapPin, { className: "w-5 h-5 sm:w-6 sm:h-6 text-red-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs sm:text-sm font-semibold text-medical-gray-500 mb-1", children: "Location" }), _jsx("p", { className: "font-medium text-medical-gray-900 text-sm sm:text-base break-words", children: selectedEvent.location })] })] })), selectedEvent.subject_id && (_jsxs("div", { className: "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-medical-gray-50 rounded-xl", children: [_jsx("div", { className: "w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm", children: _jsx(FiBook, { className: "w-5 h-5 sm:w-6 sm:h-6 text-blue-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs sm:text-sm font-semibold text-medical-gray-500 mb-2", children: "Related Subject" }), _jsx(Button, { variant: "flat", color: "primary", size: "sm", onPress: handleGoToSubject, className: "font-semibold rounded-xl text-xs sm:text-sm", children: "View Subject" })] })] })), selectedEvent.description && (_jsxs("div", { className: "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-medical-gray-50 rounded-xl", children: [_jsx("div", { className: "w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 shadow-sm", children: _jsx(FiInfo, { className: "w-5 h-5 sm:w-6 sm:h-6 text-green-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs sm:text-sm font-semibold text-medical-gray-500 mb-2", children: "Description" }), _jsx("p", { className: "text-sm sm:text-base text-medical-gray-700 leading-relaxed break-words", children: selectedEvent.description })] })] }))] }) }), _jsx(ModalFooter, { children: _jsx(Button, { variant: "light", onPress: onClose, className: "font-semibold rounded-xl", children: "Close" }) })] })) }) })] }));
}
//# sourceMappingURL=CalendarPage.js.map