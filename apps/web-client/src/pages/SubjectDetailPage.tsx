/**
 * Subject Detail Page - Dynamic Academic Page
 * Renders sections, lectures, and dynamic resource buttons
 */

import { useParams, Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Accordion,
  AccordionItem,
  Skeleton,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';
import {
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiPlay,
  FiFileText,
  FiExternalLink,
  FiVideo,
} from 'react-icons/fi';
import {
  formatDateThai,
  getResourceIcon,
  getYouTubeEmbedUrl,
  ResourceType,
} from '@medical-portal/shared';
import type { SubjectWithSections, LectureWithResources, Resource } from '@medical-portal/shared';
import VideoPlayer from '../components/VideoPlayer';

// Resource button component with dynamic styling
function ResourceButton({
  resource,
  onClick,
}: {
  resource: Resource;
  onClick: () => void;
}) {
  const getIcon = () => {
    switch (resource.type) {
      case ResourceType.YOUTUBE:
      case ResourceType.GDRIVE_VIDEO:
        return <FiPlay className="w-4 h-4" />;
      case ResourceType.GDRIVE_PDF:
        return <FiFileText className="w-4 h-4" />;
      case ResourceType.EXTERNAL:
        return <FiExternalLink className="w-4 h-4" />;
      default:
        return <FiFileText className="w-4 h-4" />;
    }
  };

  const getColor = (): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default' => {
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

  return (
    <Button
      size="sm"
      variant="flat"
      color={getColor()}
      startContent={getIcon()}
      onPress={onClick}
      className="min-w-0 font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm"
    >
      {resource.label}
    </Button>
  );
}

// Lecture card component
function LectureCard({ lecture }: { lecture: LectureWithResources }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const handleResourceClick = (resource: Resource) => {
    if (resource.type === ResourceType.YOUTUBE || resource.type === ResourceType.GDRIVE_VIDEO) {
      setSelectedResource(resource);
      onOpen();
    } else {
      // Open external links in new tab
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <Card className="card-rounded shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-medical-gray-200">
        <CardBody className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-5">
            <div className="flex-1 min-w-0">
              <h4 className="font-heading font-semibold text-base sm:text-lg text-medical-gray-900 mb-2 break-words">
                {lecture.title}
              </h4>
              {lecture.description && (
                <p className="text-xs sm:text-sm text-medical-gray-600 mt-2 leading-relaxed break-words">
                  {lecture.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm text-medical-gray-500">
                {lecture.lecture_date && (
                  <span className="flex items-center gap-1.5 sm:gap-2 bg-medical-gray-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                    <FiCalendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{formatDateThai(lecture.lecture_date)}</span>
                  </span>
                )}
                {lecture.lecturer_name && (
                  <span className="flex items-center gap-1.5 sm:gap-2 bg-medical-gray-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                    <FiUser className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{lecture.lecturer_name}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Resource Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 sm:justify-end w-full sm:w-auto">
              {lecture.resources?.map((resource) => (
                <ResourceButton
                  key={resource.id}
                  resource={resource}
                  onClick={() => handleResourceClick(resource)}
                />
              ))}
              {(!lecture.resources || lecture.resources.length === 0) && (
                <Chip variant="flat" color="default" size="md" className="rounded-lg">
                  No Files
                </Chip>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Video Player Modal */}
      <Modal 
        size="4xl" 
        isOpen={isOpen} 
        onClose={onClose} 
        scrollBehavior="inside"
        placement="center"
        classNames={{
          base: "m-2 sm:m-4",
          wrapper: "p-2 sm:p-4",
          header: "px-4 sm:px-6",
          body: "px-4 sm:px-6 pb-4 sm:pb-6",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pt-4 sm:pt-6">
            <span className="font-heading text-base sm:text-lg break-words">{lecture.title}</span>
            <span className="text-xs sm:text-sm font-normal text-medical-gray-500 break-words">
              {selectedResource?.label}
            </span>
          </ModalHeader>
          <ModalBody className="pb-4 sm:pb-6">
            {selectedResource && (
              <VideoPlayer
                resource={selectedResource}
                lectureTitle={lecture.title}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['subject', id],
    queryFn: () => api.subjects.get(id!),
    enabled: !!id,
  });

  const subject: SubjectWithSections | null = data?.data?.data || null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <Card className="bg-red-50">
        <CardBody className="p-8 text-center">
          <p className="text-red-600">Subject not found</p>
          <Button as={Link} to="/subjects" variant="flat" className="mt-4">
            Back to Subjects
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Back button */}
      <Button
        as={Link}
        to="/subjects"
        variant="light"
        size="sm"
        startContent={<FiArrowLeft className="w-4 h-4" />}
        className="text-medical-gray-600 hover:text-primary-600 font-medium rounded-xl px-3 sm:px-4 text-sm sm:text-base"
      >
        Back to Subjects
      </Button>

      {/* Subject Header */}
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="gradient-medical p-6 sm:p-8 lg:p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <FiVideo className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="flex-1 min-w-0">
              <Chip variant="flat" className="bg-white/30 text-white mb-2 sm:mb-3 font-semibold border border-white/20 text-xs sm:text-sm">
                {subject.code}
              </Chip>
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight break-words">
                {subject.name}
              </h1>
              <p className="text-blue-50 text-base sm:text-lg leading-relaxed mb-3 sm:mb-4 break-words">{subject.description}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-blue-50">
                <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg backdrop-blur-sm">
                  Year {subject.year_level}
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg backdrop-blur-sm">
                  {subject.sections?.length || 0} Sections
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Sections with Lectures */}
      {subject.sections && subject.sections.length > 0 ? (
        <Accordion
          selectionMode="multiple"
          defaultExpandedKeys={[subject.sections[0]?.id]}
          variant="shadow"
          className="px-0"
        >
          {subject.sections.map((section, index) => (
            <AccordionItem
              key={section.id}
              aria-label={section.name}
              title={
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center text-sm sm:text-base font-bold shadow-sm flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-heading font-bold text-base sm:text-lg text-medical-gray-900 break-words">
                      {section.name}
                    </span>
                    <p className="text-xs sm:text-sm text-medical-gray-500 mt-0.5 sm:mt-1">
                      {section.lectures?.length || 0} Lectures
                    </p>
                  </div>
                </div>
              }
              classNames={{
                content: 'pt-0 pb-4 px-4',
              }}
            >
              <div className="space-y-4 mt-4">
                {section.lectures?.map((lecture) => (
                  <LectureCard key={lecture.id} lecture={lecture} />
                ))}
                {(!section.lectures || section.lectures.length === 0) && (
                  <div className="text-center py-12 text-medical-gray-400 bg-medical-gray-50 rounded-xl border-2 border-dashed border-medical-gray-200">
                    <FiVideo className="w-12 h-12 mx-auto mb-3 text-medical-gray-300" />
                    <p className="font-medium">No lectures in this section yet</p>
                  </div>
                )}
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card className="bg-medical-gray-50">
          <CardBody className="p-12 text-center">
            <FiVideo className="w-16 h-16 text-medical-gray-300 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-semibold text-medical-gray-600 mb-2">
              No Content Available
            </h3>
            <p className="text-medical-gray-500">
              This subject doesn't have content yet. Please check back later.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
