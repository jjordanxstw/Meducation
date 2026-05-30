'use client';

/**
 * Subject Detail Page - Dynamic Academic Page
 * Next.js adapted version
 */

import React from 'react';
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
  type Selection,
} from '@nextui-org/react';
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
import {
  formatDateThai,
  ResourceType,
} from '@medical-portal/shared';
import type { LectureWithResources, Resource } from '@medical-portal/shared';
import { VideoPlayer } from '@/components/client/VideoPlayer';
import { PageTransition } from '@/components/PageTransition';

// Maps a lecture's primary resource type to a left-side row icon.
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
      className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100 hover:text-blue-700 dark:border-blue-500/30 dark:bg-blue-600/20 dark:text-blue-400 dark:hover:bg-blue-600/40 dark:hover:text-blue-300"
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
      <div className="mb-2 rounded-xl border border-slate-200 bg-white px-4 py-4 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#0d1b2e] dark:hover:border-white/15 dark:hover:bg-white/[0.04]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-blue-500 dark:text-blue-400" aria-hidden>
                {lectureTypeIcon(lecture)}
              </span>
              <h4 className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                {lecture.title}
              </h4>
            </div>
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
      </div>

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
  params: Promise<{ id: string }>;
}) {
  // Next.js 15: params is a Promise and must be unwrapped
  const { id } = React.use(params);

  const { data: subject = null, isLoading, isError, error, refetch } = useSubjectDetail(id);

  // Track which accordion sections are open so the lecture-count preview can
  // fade out when its section expands. Defaults to the first section open.
  const firstSectionId = subject?.sections?.[0]?.id;
  const [openKeys, setOpenKeys] = useState<Selection | null>(null);
  const effectiveOpenKeys: Selection =
    openKeys ?? new Set<string>(firstSectionId ? [firstSectionId] : []);

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
      <PageTransition className="mx-auto max-w-2xl px-6">
        <Card className="glass-surface cursor-default">
          <CardBody className="flex flex-col items-center gap-4 py-16 text-center">
            <FiAlertCircle className="h-12 w-12 text-red-400 opacity-50" />
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-white/50">{message}</p>
            </div>
            <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                color="primary"
                className="btn-precise"
                onPress={() => void refetch()}
              >
                Try Again
              </Button>
              <Link href="/subjects">
                <Button
                  variant="light"
                  className="btn-precise text-[var(--ink-2)]"
                  startContent={<span className="icon-with-text"><FiArrowLeft className="h-4 w-4" /></span>}
                >
                  Back to Subjects
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6 px-6">
      {/* Back button */}
      <Link href="/subjects" className="inline-block">
        <button
          type="button"
          className="mb-5 flex items-center gap-2 rounded-full border border-slate-200 bg-[var(--bg-surface)] px-4 py-2 text-sm font-medium text-[var(--ink-2)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] hover:text-[var(--ink-1)] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Subjects
        </button>
      </Link>

      {/* Subject Header */}
      <Card className="glass-card relative overflow-hidden border-l-[3px] border-l-blue-500 text-[var(--ink-1)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(59,130,246,0.05),transparent_36%),radial-gradient(circle_at_82%_20%,rgba(14,165,233,0.04),transparent_42%)] dark:bg-[radial-gradient(circle_at_12%_15%,rgba(59,130,246,0.14),transparent_36%),radial-gradient(circle_at_82%_20%,rgba(14,165,233,0.11),transparent_42%)]" />
        <CardBody className="gap-4 p-6">
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-100 dark:border-blue-500/30 dark:bg-blue-600/20">
              <FiVideo className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 dark:bg-white/10 dark:text-white/60">
                {subject.code}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {subject.name}
              </h1>
              <p className="line-clamp-3 text-sm text-slate-600 dark:text-[var(--ink-2)] sm:text-base">{subject.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300">
                  Year {subject.year_level}
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300">
                  {subject.sections?.length || 0} Sections
                </span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Sections with Lectures */}
      {subject.sections && subject.sections.length > 0 ? (
        <Accordion
          selectionMode="multiple"
          selectedKeys={effectiveOpenKeys}
          onSelectionChange={(keys) => setOpenKeys(keys)}
          variant="splitted"
          className="gap-3"
        >
          {subject.sections.map((section, index) => {
            const isOpen = effectiveOpenKeys === 'all' || effectiveOpenKeys.has(section.id);
            return (
            <AccordionItem
              key={section.id}
              aria-label={section.name}
              title={
                <div className="flex items-center gap-3 px-2 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-100 text-sm font-bold text-blue-600 dark:border-blue-500/30 dark:bg-blue-600/25 dark:text-blue-300">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {section.name}
                    </span>
                    <p
                      className={`text-xs text-slate-500 transition-opacity duration-200 dark:text-white/40 ${
                        isOpen ? 'opacity-0' : 'opacity-100'
                      }`}
                    >
                      {section.lectures?.length || 0} Lectures
                    </p>
                  </div>
                </div>
              }
            >
              <div className="mb-3 mt-2">
                {section.lectures?.map((lecture) => (
                  <LectureCard key={lecture.id} lecture={lecture} />
                ))}
                {(!section.lectures || section.lectures.length === 0) && (
                  <Card className="glass-surface">
                    <CardBody className="text-center py-16">
                      <FiVideo className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-default-300" />
                      <p className="font-medium text-slate-600 dark:text-white">No lectures in this section yet</p>
                    </CardBody>
                  </Card>
                )}
              </div>
            </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <Card className="glass-surface">
          <CardBody className="text-center py-16">
            <FiVideo className="mx-auto mb-4 h-16 w-16 text-slate-300 dark:text-default-300" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Content Available</h3>
            <p className="text-slate-500 dark:text-default-500">
              This subject doesn&apos;t have content yet. Please check back later.
            </p>
          </CardBody>
        </Card>
      )}
    </PageTransition>
  );
}
