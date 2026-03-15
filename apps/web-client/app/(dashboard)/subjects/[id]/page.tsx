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
      startContent={<span className="icon-with-text">{getIcon()}</span>}
      onPress={onClick}
      className="btn-precise max-w-full"
    >
      <span className="max-w-[10rem] truncate">{resource.label}</span>
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
      <Card isBlurred className="glass-surface hover:scale-[1.01] transition-transform">
        <CardBody className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0 space-y-2">
              <h4 className="font-semibold text-[var(--ink-1)] line-clamp-1">
                {lecture.title}
              </h4>
              {lecture.description && (
                <p className="text-sm text-[var(--ink-2)] line-clamp-2">
                  {lecture.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-sm">
                {lecture.lecture_date && (
                  <Chip size="sm" variant="flat" startContent={<span className="icon-with-text"><FiCalendar className="h-3 w-3" /></span>}>
                    {formatDateThai(lecture.lecture_date)}
                  </Chip>
                )}
                {lecture.lecturer_name && (
                  <Chip size="sm" variant="flat" startContent={<span className="icon-with-text"><FiUser className="h-3 w-3" /></span>}>
                    {lecture.lecturer_name}
                  </Chip>
                )}
              </div>
            </div>

            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
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
      <Card className="glass-surface">
        <CardBody className="text-center py-16">
          <p className="text-danger mb-4">Subject not found</p>
          <Link href="/subjects">
            <Button
              variant="flat"
              className="btn-precise"
              startContent={<span className="icon-with-text"><FiArrowLeft className="h-4 w-4" /></span>}
            >
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
      <Link href="/subjects" className="inline-block w-full sm:w-auto">
        <Button
          variant="flat"
          size="sm"
          className="glass-soft w-full sm:w-auto"
          startContent={<span className="icon-with-text"><FiArrowLeft className="h-4 w-4" /></span>}
        >
          Back to Subjects
        </Button>
      </Link>

      {/* Subject Header */}
      <Card className="glass-card relative overflow-hidden text-[var(--ink-1)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(59,130,246,0.2),transparent_36%),radial-gradient(circle_at_82%_20%,rgba(14,165,233,0.16),transparent_42%)]" />
        <CardBody className="gap-4 p-6 sm:p-8 lg:p-12">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="glass-soft flex h-16 w-16 shrink-0 items-center justify-center rounded-xl shadow-lg sm:h-20 sm:w-20">
              <FiVideo className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <Chip size="sm" variant="flat" className="glass-soft w-fit text-[var(--ink-1)] border-white/20">
                {subject.code}
              </Chip>
              <h1 className="text-[clamp(1.5rem,4.8vw,2.6rem)] font-bold leading-tight line-clamp-2">
                {subject.name}
              </h1>
              <p className="line-clamp-3 text-sm text-[var(--ink-2)] sm:text-base">{subject.description}</p>
              <div className="flex flex-wrap gap-2">
                <Chip size="sm" variant="flat" className="glass-soft text-[var(--ink-1)]">
                  Year {subject.year_level}
                </Chip>
                <Chip size="sm" variant="flat" className="glass-soft text-[var(--ink-1)]">
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
                  <Card className="glass-surface">
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
        <Card className="glass-surface">
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
