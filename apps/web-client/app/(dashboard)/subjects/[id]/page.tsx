'use client';

/**
 * Subject Detail Page — sections accordion + lecture cards + video modal.
 * HeroUI + Tailwind only.
 */

import React from 'react';
import Link from 'next/link';
import {
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
  type Selection,
} from '@heroui/react';
import { useState } from 'react';
import axios from 'axios';
import { useSubjectDetail } from '@/hooks/use-subjects';
import {
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiPlay,
  FiFileText,
  FiExternalLink,
  FiVideo,
  FiAlertCircle,
} from 'react-icons/fi';
import { formatDateThai, ResourceType } from '@medical-portal/shared';
import type { LectureWithResources, Resource } from '@medical-portal/shared';
import { VideoPlayer } from '@/components/client/VideoPlayer';
import { PageTransition } from '@/components/PageTransition';

function lectureTypeIcon(lecture: LectureWithResources) {
  const type = lecture.resources?.[0]?.type;
  switch (type) {
    case ResourceType.YOUTUBE:
    case ResourceType.GDRIVE_VIDEO:
      return <FiVideo className="h-4 w-4" />;
    case ResourceType.GDRIVE_PDF:
      return <FiFileText className="h-4 w-4" />;
    case ResourceType.EXTERNAL:
      return <FiExternalLink className="h-4 w-4" />;
    default:
      return <FiFileText className="h-4 w-4" />;
  }
}

function ResourceButton({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  const getIcon = () => {
    switch (resource.type) {
      case ResourceType.YOUTUBE:
      case ResourceType.GDRIVE_VIDEO:
        return <FiPlay className="h-3.5 w-3.5" />;
      case ResourceType.GDRIVE_PDF:
        return <FiFileText className="h-3.5 w-3.5" />;
      case ResourceType.EXTERNAL:
        return <FiExternalLink className="h-3.5 w-3.5" />;
      default:
        return <FiFileText className="h-3.5 w-3.5" />;
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand-subtle px-3 py-1.5 text-xs font-medium text-brand transition hover:border-brand/40 hover:bg-brand/15"
    >
      {getIcon()}
      <span className="max-w-[10rem] truncate">{resource.label}</span>
    </button>
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
      <div className="mb-2 rounded-xl border border-slate-200/70 bg-white px-4 py-4 transition-colors duration-150 hover:border-brand/30 hover:bg-brand-subtle/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-brand" aria-hidden>
                {lectureTypeIcon(lecture)}
              </span>
              <h4 className="line-clamp-1 text-sm font-medium text-slate-900">{lecture.title}</h4>
            </div>
            {lecture.description && (
              <p className="line-clamp-2 text-sm text-slate-500">{lecture.description}</p>
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
      </div>

      <Modal size="4xl" isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <div className="flex flex-col gap-1">
              <span className="line-clamp-2 font-serif text-lg font-semibold tracking-tight">{lecture.title}</span>
              <span className="text-sm font-sans text-slate-500">{selectedResource?.label}</span>
            </div>
          </ModalHeader>
          <ModalBody className="pb-6">
            {selectedResource && <VideoPlayer resource={selectedResource} lectureTitle={lecture.title} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: subject = null, isLoading, isError, error, refetch } = useSubjectDetail(id);

  const firstSectionId = subject?.sections?.[0]?.id;
  const [openKeys, setOpenKeys] = useState<Selection | null>(null);
  const effectiveOpenKeys: Selection =
    openKeys ?? new Set<string>(firstSectionId ? [firstSectionId] : []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-48 rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !subject) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    let title = 'Something went wrong';
    let message = 'We couldn’t load this subject. Please try again.';
    if (status === 404 || (!isError && !subject)) {
      title = 'Subject not found';
      message = 'This subject may have been moved or removed.';
    } else if (status === 403) {
      title = 'Access denied';
      message = 'You don’t have permission to view this subject.';
    } else if (isError && status === undefined) {
      title = 'Connection failed';
      message = 'Check your internet connection and try again.';
    }

    return (
      <PageTransition className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/70 bg-white py-16 text-center shadow-subtle">
          <FiAlertCircle className="h-12 w-12 text-red-400" />
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{message}</p>
          </div>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Button color="primary" onPress={() => void refetch()}>
              Try Again
            </Button>
            <Button
              as={Link}
              href="/subjects"
              variant="light"
              className="text-slate-600"
              startContent={<FiArrowLeft className="h-4 w-4" />}
            >
              Back to Subjects
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6">
      {/* Back button */}
      <Button
        as={Link}
        href="/subjects"
        variant="bordered"
        radius="full"
        size="sm"
        className="border-slate-200 text-slate-600"
        startContent={<FiArrowLeft className="h-4 w-4" />}
      >
        Back to Subjects
      </Button>

      {/* Subject header */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-subtle">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-subtle text-brand">
            <FiVideo className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
              {subject.code}
            </span>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {subject.name}
            </h1>
            {subject.description && (
              <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                {subject.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                Year {subject.year_level}
              </span>
              <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500">
                {subject.sections?.length || 0} Sections
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {subject.sections && subject.sections.length > 0 ? (
        <Accordion
          selectionMode="multiple"
          selectedKeys={effectiveOpenKeys}
          onSelectionChange={(keys) => setOpenKeys(keys)}
          variant="splitted"
          className="gap-3 px-0"
          itemClasses={{
            base: 'border border-slate-200/70 bg-white shadow-none rounded-2xl',
            trigger: 'py-3',
            title: 'text-sm font-semibold text-slate-900',
          }}
        >
          {subject.sections.map((section, index) => {
            const isOpen = effectiveOpenKeys === 'all' || effectiveOpenKeys.has(section.id);
            return (
              <AccordionItem
                key={section.id}
                aria-label={section.name}
                title={
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-sm font-bold text-brand">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-semibold text-slate-900">{section.name}</span>
                      <p className={`text-xs text-slate-500 transition-opacity ${isOpen ? 'opacity-0' : 'opacity-100'}`}>
                        {section.lectures?.length || 0} Lectures
                      </p>
                    </div>
                  </div>
                }
              >
                <div className="mb-3 mt-1">
                  {section.lectures?.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} />)}
                  {(!section.lectures || section.lectures.length === 0) && (
                    <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                      <FiVideo className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                      <p className="font-medium text-slate-500">No lectures in this section yet</p>
                    </div>
                  )}
                </div>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="rounded-2xl border border-slate-200/70 bg-white py-16 text-center shadow-subtle">
          <FiVideo className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h3 className="mb-2 font-serif text-xl font-semibold text-slate-900">No content available</h3>
          <p className="text-slate-500">This subject doesn&apos;t have content yet. Please check back later.</p>
        </div>
      )}
    </PageTransition>
  );
}
