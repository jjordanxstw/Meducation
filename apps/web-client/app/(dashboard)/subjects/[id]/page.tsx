'use client';

/**
 * Subject Detail Page - Dynamic Academic Page
 * Next.js adapted version
 */

import Link from 'next/link';
import {
  Card,
  CardBody,
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
} from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
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
  ResourceType,
} from '@medical-portal/shared';
import type { SubjectWithSections, LectureWithResources, Resource } from '@medical-portal/shared';
import { VideoPlayer } from '@/components/client/VideoPlayer';

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
        return <FiPlay className="h-4 w-4" />;
      case ResourceType.GDRIVE_PDF:
        return <FiFileText className="h-4 w-4" />;
      case ResourceType.EXTERNAL:
        return <FiExternalLink className="h-4 w-4" />;
      default:
        return <FiFileText className="h-4 w-4" />;
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
    >
      {resource.label}
    </Button>
  );
}

function LectureCard({ lecture }: { lecture: LectureWithResources }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const handleResourceClick = (resource: Resource) => {
    if (resource.type === ResourceType.YOUTUBE || resource.type === ResourceType.GDRIVE_VIDEO) {
      setSelectedResource(resource);
      onOpen();
    } else {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <Card isBlurred className="hover:scale-[1.01] transition-transform">
        <CardBody className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0 space-y-2">
              <h4 className="font-semibold text-foreground line-clamp-1">
                {lecture.title}
              </h4>
              {lecture.description && (
                <p className="text-sm text-default-600 line-clamp-2">
                  {lecture.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-sm">
                {lecture.lecture_date && (
                  <Chip size="sm" variant="flat" startContent={<FiCalendar className="h-3 w-3" />}>
                    {formatDateThai(lecture.lecture_date)}
                  </Chip>
                )}
                {lecture.lecturer_name && (
                  <Chip size="sm" variant="flat" startContent={<FiUser className="h-3 w-3" />}>
                    {lecture.lecturer_name}
                  </Chip>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {lecture.resources?.map((resource) => (
                <ResourceButton
                  key={resource.id}
                  resource={resource}
                  onClick={() => handleResourceClick(resource)}
                />
              ))}
              {(!lecture.resources || lecture.resources.length === 0) && (
                <Chip size="sm" variant="flat">
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
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex flex-col gap-1">
              <span className="font-semibold line-clamp-2">{lecture.title}</span>
              <span className="text-sm text-default-500">{selectedResource?.label}</span>
            </div>
          </ModalHeader>
          <ModalBody>
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

export default function SubjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['subject', id],
    queryFn: () => api.subjects.get(id),
    enabled: !!id,
  });

  const subject: SubjectWithSections | null = data?.data?.data || null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
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
      <Card>
        <CardBody className="text-center py-16">
          <p className="text-danger mb-4">Subject not found</p>
          <Link href="/subjects">
            <Button variant="flat">
              Back to Subjects
            </Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/subjects">
        <Button
          variant="flat"
          size="sm"
          startContent={<FiArrowLeft className="h-4 w-4" />}
        >
          Back to Subjects
        </Button>
      </Link>

      {/* Subject Header */}
      <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <CardBody className="gap-4 p-6 sm:p-8 lg:p-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg sm:h-20 sm:w-20">
              <FiVideo className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <Chip size="sm" variant="flat" className="bg-white/20 text-white border-white/30 w-fit">
                {subject.code}
              </Chip>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold line-clamp-2">
                {subject.name}
              </h1>
              <p className="text-blue-50 line-clamp-2">{subject.description}</p>
              <div className="flex flex-wrap gap-2">
                <Chip size="sm" variant="flat" className="bg-white/20 text-white">
                  Year {subject.year_level}
                </Chip>
                <Chip size="sm" variant="flat" className="bg-white/20 text-white">
                  {subject.sections?.length || 0} Sections
                </Chip>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Sections with Lectures */}
      {subject.sections && subject.sections.length > 0 ? (
        <Accordion
          selectionMode="multiple"
          defaultExpandedKeys={[subject.sections[0]?.id]}
          variant="splitted"
          className="gap-3"
        >
          {subject.sections.map((section, index) => (
            <AccordionItem
              key={section.id}
              aria-label={section.name}
              title={
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-foreground line-clamp-1">
                      {section.name}
                    </span>
                    <p className="text-xs text-default-500">
                      {section.lectures?.length || 0} Lectures
                    </p>
                  </div>
                </div>
              }
            >
              <div className="space-y-4 pt-2">
                {section.lectures?.map((lecture) => (
                  <LectureCard key={lecture.id} lecture={lecture} />
                ))}
                {(!section.lectures || section.lectures.length === 0) && (
                  <Card>
                    <CardBody className="text-center py-16">
                      <FiVideo className="mx-auto mb-4 h-12 w-12 text-default-300" />
                      <p className="font-medium">No lectures in this section yet</p>
                    </CardBody>
                  </Card>
                )}
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card>
          <CardBody className="text-center py-16">
            <FiVideo className="mx-auto mb-4 h-16 w-16 text-default-300" />
            <h3 className="font-semibold text-lg mb-2">No Content Available</h3>
            <p className="text-default-500">
              This subject doesn't have content yet. Please check back later.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
