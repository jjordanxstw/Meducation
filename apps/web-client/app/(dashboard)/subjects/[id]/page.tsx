'use client';

/**
 * Subject Detail Page — sections accordion + lecture cards + video modal.
 * Tailwind + Radix primitives only.
 */

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useState } from 'react';
import axios from 'axios';
import { useSubjectDetail } from '@/hooks/use-subjects';
import {
  ArrowLeft,
  Calendar,
  User,
  Play,
  FileText,
  ExternalLink,
  Video,
  AlertCircle,
} from 'lucide-react';
import { formatDateThai, ResourceType } from '@medical-portal/shared';
import type { LectureWithResources, Resource } from '@medical-portal/shared';
import { VideoPlayer } from '@/components/client/VideoPlayer';
import { PageTransition } from '@/components/PageTransition';

function lectureTypeIcon(lecture: LectureWithResources) {
  const type = lecture.resources?.[0]?.type;
  switch (type) {
    case ResourceType.YOUTUBE:
    case ResourceType.GDRIVE_VIDEO:
      return <Video className="h-4 w-4" />;
    case ResourceType.GDRIVE_PDF:
      return <FileText className="h-4 w-4" />;
    case ResourceType.EXTERNAL:
      return <ExternalLink className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function ResourceButton({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  const getIcon = () => {
    switch (resource.type) {
      case ResourceType.YOUTUBE:
      case ResourceType.GDRIVE_VIDEO:
        return <Play className="h-3.5 w-3.5" />;
      case ResourceType.GDRIVE_PDF:
        return <FileText className="h-3.5 w-3.5" />;
      case ResourceType.EXTERNAL:
        return <ExternalLink className="h-3.5 w-3.5" />;
      default:
        return <FileText className="h-3.5 w-3.5" />;
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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const handleResourceClick = (resource: Resource) => {
    if (resource.type === ResourceType.YOUTUBE || resource.type === ResourceType.GDRIVE_VIDEO) {
      setSelectedResource(resource);
      setIsOpen(true);
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
                <Badge variant="neutral">
                  <Calendar className="h-3 w-3" />
                  {formatDateThai(lecture.lecture_date)}
                </Badge>
              )}
              {lecture.lecturer_name && (
                <Badge variant="neutral">
                  <User className="h-3 w-3" />
                  {lecture.lecturer_name}
                </Badge>
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
              <Badge variant="neutral">No Files</Badge>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="line-clamp-2">{lecture.title}</DialogTitle>
            <DialogDescription>{selectedResource?.label}</DialogDescription>
          </DialogHeader>
          {selectedResource && <VideoPlayer resource={selectedResource} lectureTitle={lecture.title} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: subject = null, isLoading, isError, error, refetch } = useSubjectDetail(id);

  const firstSectionId = subject?.sections?.[0]?.id;
  const [openKeys, setOpenKeys] = useState<string[] | null>(null);
  const effectiveOpenKeys = openKeys ?? (firstSectionId ? [firstSectionId] : []);

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
          <AlertCircle className="h-12 w-12 text-red-400" />
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{message}</p>
          </div>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Button onClick={() => void refetch()}>Try Again</Button>
            <Button asChild variant="ghost">
              <Link href="/subjects">
                <ArrowLeft className="h-4 w-4" />
                Back to Subjects
              </Link>
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6">
      {/* Back button — sits at the top in flow, then sticks just below the
          header so it stays reachable while scrolling. */}
      <div className="sticky top-20 z-20 w-fit">
        <Button asChild variant="secondary" size="sm" className="rounded-full text-slate-600 shadow-soft">
          <Link href="/subjects">
            <ArrowLeft className="h-4 w-4" />
            Back to Subjects
          </Link>
        </Button>
      </div>

      {/* Subject header */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle">
        {/* Cover band: subject image when present, otherwise a branded placeholder
            so the header always reads as designed. */}
        <div className="relative h-56 w-full overflow-hidden bg-brand-subtle sm:h-72 lg:h-80">
          {subject.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={subject.thumbnail_url}
              alt={`${subject.code} cover`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand/30">
              <Video className="h-12 w-12" />
            </div>
          )}
        </div>

        <div className="p-6">
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
          type="multiple"
          value={effectiveOpenKeys}
          onValueChange={(keys) => setOpenKeys(keys)}
          className="flex flex-col gap-3"
        >
          {subject.sections.map((section, index) => {
            const isOpen = effectiveOpenKeys.includes(section.id);
            return (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger aria-label={section.name}>
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
                </AccordionTrigger>
                <AccordionContent>
                  {section.lectures?.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} />)}
                  {(!section.lectures || section.lectures.length === 0) && (
                    <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                      <Video className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                      <p className="font-medium text-slate-500">No lectures in this section yet</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="rounded-2xl border border-slate-200/70 bg-white py-16 text-center shadow-subtle">
          <Video className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h3 className="mb-2 font-serif text-xl font-semibold text-slate-900">No content available</h3>
          <p className="text-slate-500">This subject doesn&apos;t have content yet. Please check back later.</p>
        </div>
      )}
    </PageTransition>
  );
}
