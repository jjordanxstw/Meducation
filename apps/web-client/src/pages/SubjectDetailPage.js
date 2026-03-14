import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Subject Detail Page - Dynamic Academic Page
 * Renders sections, lectures, and dynamic resource buttons
 */
import { useParams, Link } from 'react-router-dom';
import { Card, CardBody, Button, Accordion, AccordionItem, Skeleton, Chip, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure, } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';
import { FiArrowLeft, FiCalendar, FiUser, FiPlay, FiFileText, FiExternalLink, FiVideo, } from 'react-icons/fi';
import { formatDateThai, ResourceType, } from '@medical-portal/shared';
import VideoPlayer from '../components/VideoPlayer';
// Resource button component with dynamic styling
function ResourceButton({ resource, onClick, }) {
    const getIcon = () => {
        switch (resource.type) {
            case ResourceType.YOUTUBE:
            case ResourceType.GDRIVE_VIDEO:
                return _jsx(FiPlay, { className: "w-4 h-4" });
            case ResourceType.GDRIVE_PDF:
                return _jsx(FiFileText, { className: "w-4 h-4" });
            case ResourceType.EXTERNAL:
                return _jsx(FiExternalLink, { className: "w-4 h-4" });
            default:
                return _jsx(FiFileText, { className: "w-4 h-4" });
        }
    };
    const getColor = () => {
        switch (resource.type) {
            case ResourceType.YOUTUBE:
                return 'danger';
            case ResourceType.GDRIVE_VIDEO:
                return 'primary';
            case ResourceType.GDRIVE_PDF:
                return 'success';
            case ResourceType.EXTERNAL:
                return 'secondary';
            default:
                return 'default';
        }
    };
    return (_jsx(Button, { size: "sm", variant: "flat", color: getColor(), startContent: getIcon(), onPress: onClick, className: "min-w-0 font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm", children: resource.label }));
}
// Lecture card component
function LectureCard({ lecture }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedResource, setSelectedResource] = useState(null);
    const handleResourceClick = (resource) => {
        if (resource.type === ResourceType.YOUTUBE || resource.type === ResourceType.GDRIVE_VIDEO) {
            setSelectedResource(resource);
            onOpen();
        }
        else {
            // Open external links in new tab
            window.open(resource.url, '_blank', 'noopener,noreferrer');
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Card, { className: "card-rounded shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-medical-gray-200", children: _jsx(CardBody, { className: "p-4 sm:p-5 lg:p-6", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-5", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-heading font-semibold text-base sm:text-lg text-medical-gray-900 mb-2 break-words", children: lecture.title }), lecture.description && (_jsx("p", { className: "text-xs sm:text-sm text-medical-gray-600 mt-2 leading-relaxed break-words", children: lecture.description })), _jsxs("div", { className: "flex flex-wrap items-center gap-2 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm text-medical-gray-500", children: [lecture.lecture_date && (_jsxs("span", { className: "flex items-center gap-1.5 sm:gap-2 bg-medical-gray-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg", children: [_jsx(FiCalendar, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" }), _jsx("span", { className: "truncate", children: formatDateThai(lecture.lecture_date) })] })), lecture.lecturer_name && (_jsxs("span", { className: "flex items-center gap-1.5 sm:gap-2 bg-medical-gray-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg", children: [_jsx(FiUser, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" }), _jsx("span", { className: "truncate", children: lecture.lecturer_name })] }))] })] }), _jsxs("div", { className: "flex flex-wrap gap-2 sm:gap-3 sm:justify-end w-full sm:w-auto", children: [lecture.resources?.map((resource) => (_jsx(ResourceButton, { resource: resource, onClick: () => handleResourceClick(resource) }, resource.id))), (!lecture.resources || lecture.resources.length === 0) && (_jsx(Chip, { variant: "flat", color: "default", size: "md", className: "rounded-lg", children: "No Files" }))] })] }) }) }), _jsx(Modal, { size: "4xl", isOpen: isOpen, onClose: onClose, scrollBehavior: "inside", placement: "center", classNames: {
                    base: "m-2 sm:m-4",
                    wrapper: "p-2 sm:p-4",
                    header: "px-4 sm:px-6",
                    body: "px-4 sm:px-6 pb-4 sm:pb-6",
                }, children: _jsxs(ModalContent, { children: [_jsxs(ModalHeader, { className: "flex flex-col gap-1 pt-4 sm:pt-6", children: [_jsx("span", { className: "font-heading text-base sm:text-lg break-words", children: lecture.title }), _jsx("span", { className: "text-xs sm:text-sm font-normal text-medical-gray-500 break-words", children: selectedResource?.label })] }), _jsx(ModalBody, { className: "pb-4 sm:pb-6", children: selectedResource && (_jsx(VideoPlayer, { resource: selectedResource, lectureTitle: lecture.title })) })] }) })] }));
}
export default function SubjectDetailPage() {
    const { id } = useParams();
    const { profile } = useAuthStore();
    const { data, isLoading, error } = useQuery({
        queryKey: ['subject', id],
        queryFn: () => api.subjects.get(id),
        enabled: !!id,
    });
    const subject = data?.data?.data || null;
    if (isLoading) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsx(Skeleton, { className: "h-8 w-48" }), _jsx(Skeleton, { className: "h-48 rounded-xl" }), _jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-24 rounded-lg" }), _jsx(Skeleton, { className: "h-24 rounded-lg" }), _jsx(Skeleton, { className: "h-24 rounded-lg" })] })] }));
    }
    if (error || !subject) {
        return (_jsx(Card, { className: "bg-red-50", children: _jsxs(CardBody, { className: "p-8 text-center", children: [_jsx("p", { className: "text-red-600", children: "Subject not found" }), _jsx(Button, { as: Link, to: "/subjects", variant: "flat", className: "mt-4", children: "Back to Subjects" })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6 sm:space-y-8 animate-fade-in", children: [_jsx(Button, { as: Link, to: "/subjects", variant: "light", size: "sm", startContent: _jsx(FiArrowLeft, { className: "w-4 h-4" }), className: "text-medical-gray-600 hover:text-primary-600 font-medium rounded-xl px-3 sm:px-4 text-sm sm:text-base", children: "Back to Subjects" }), _jsx(Card, { className: "overflow-hidden border-0 shadow-xl", children: _jsxs("div", { className: "gradient-medical p-6 sm:p-8 lg:p-12 text-white relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" }), _jsxs("div", { className: "relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6", children: [_jsx("div", { className: "w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg", children: _jsx(FiVideo, { className: "w-8 h-8 sm:w-10 sm:h-10" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(Chip, { variant: "flat", className: "bg-white/30 text-white mb-2 sm:mb-3 font-semibold border border-white/20 text-xs sm:text-sm", children: subject.code }), _jsx("h1", { className: "font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight break-words", children: subject.name }), _jsx("p", { className: "text-blue-50 text-base sm:text-lg leading-relaxed mb-3 sm:mb-4 break-words", children: subject.description }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-blue-50", children: [_jsxs("span", { className: "flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg backdrop-blur-sm", children: ["Year ", subject.year_level] }), _jsxs("span", { className: "flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg backdrop-blur-sm", children: [subject.sections?.length || 0, " Sections"] })] })] })] })] }) }), subject.sections && subject.sections.length > 0 ? (_jsx(Accordion, { selectionMode: "multiple", defaultExpandedKeys: [subject.sections[0]?.id], variant: "shadow", className: "px-0", children: subject.sections.map((section, index) => (_jsx(AccordionItem, { "aria-label": section.name, title: _jsxs("div", { className: "flex items-center gap-3 sm:gap-4", children: [_jsx("span", { className: "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center text-sm sm:text-base font-bold shadow-sm flex-shrink-0", children: index + 1 }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "font-heading font-bold text-base sm:text-lg text-medical-gray-900 break-words", children: section.name }), _jsxs("p", { className: "text-xs sm:text-sm text-medical-gray-500 mt-0.5 sm:mt-1", children: [section.lectures?.length || 0, " Lectures"] })] })] }), classNames: {
                        content: 'pt-0 pb-4 px-4',
                    }, children: _jsxs("div", { className: "space-y-4 mt-4", children: [section.lectures?.map((lecture) => (_jsx(LectureCard, { lecture: lecture }, lecture.id))), (!section.lectures || section.lectures.length === 0) && (_jsxs("div", { className: "text-center py-12 text-medical-gray-400 bg-medical-gray-50 rounded-xl border-2 border-dashed border-medical-gray-200", children: [_jsx(FiVideo, { className: "w-12 h-12 mx-auto mb-3 text-medical-gray-300" }), _jsx("p", { className: "font-medium", children: "No lectures in this section yet" })] }))] }) }, section.id))) })) : (_jsx(Card, { className: "bg-medical-gray-50", children: _jsxs(CardBody, { className: "p-12 text-center", children: [_jsx(FiVideo, { className: "w-16 h-16 text-medical-gray-300 mx-auto mb-4" }), _jsx("h3", { className: "font-heading text-lg font-semibold text-medical-gray-600 mb-2", children: "No Content Available" }), _jsx("p", { className: "text-medical-gray-500", children: "This subject doesn't have content yet. Please check back later." })] }) }))] }));
}
//# sourceMappingURL=SubjectDetailPage.js.map