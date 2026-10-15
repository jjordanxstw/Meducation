'use client';

/**
 * Lecture page (Brilliant: Student Desktop / Lecture). Focus layout: the
 * player, the lecture's materials as cards, and the section's lectures on the
 * right. J / K jump to the previous / next lecture. Served entirely from the
 * subject-detail query, so switching lectures is instant.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, FileText, Link2, PlayCircle, User, Video, Volume2 } from 'lucide-react';
import { ResourceType } from '@medical-portal/shared';
import type { LectureWithResources, Resource, SectionWithLectures } from '@medical-portal/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer } from '@/components/client/VideoPlayer';
import { PageTransition } from '@/components/PageTransition';
import { EmptyState } from '@/components/states/EmptyState';
import { requestCode } from '@/lib/request-code';
import { useSubjectDetail } from '@/hooks/use-subjects';
import { rememberLecture } from '@/lib/recently-opened';
import { notify } from '@/lib/notify';
import { cn } from '@/lib/utils';
import { formatDuration, isVideoResource, resourceKindLabel } from '@/lib/resources';
import { youtubeWatchUrl } from '@/lib/youtube';
import { useAuthStore } from '@/stores/auth.store';

function LectureSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]" aria-busy="true">
      <div className="space-y-4">
        <Skeleton className="h-4 w-72 rounded" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-7 w-2/3 rounded" />
        <Skeleton className="h-4 w-1/3 rounded" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}

type Located = {
  section: SectionWithLectures;
  sectionIndex: number;
  lectures: LectureWithResources[];
  index: number;
  lecture: LectureWithResources;
  globalIndex: number;
  total: number;
};

function locateLecture(sections: SectionWithLectures[], lectureId: string): Located | null {
  const total = sections.reduce((sum, section) => sum + (section.lectures?.length ?? 0), 0);
  let before = 0;
  for (const [sectionIndex, section] of sections.entries()) {
    const lectures = section.lectures ?? [];
    const index = lectures.findIndex((lecture) => lecture.id === lectureId);
    if (index >= 0) {
      return { section, sectionIndex, lectures, index, lecture: lectures[index], globalIndex: before + index + 1, total };
    }
    before += lectures.length;
  }
  return null;
}

function minutes(resource?: Resource): string | null {
  return resource?.duration_seconds ? `${Math.round(resource.duration_seconds / 60)} min` : null;
}

function lectureSummary(lecture: LectureWithResources): string {
  const video = lecture.resources?.find(isVideoResource);
  const hasSlides = lecture.resources?.some((resource) => resource.type === ResourceType.GDRIVE_PDF);
  return [minutes(video), hasSlides ? 'slides' : null].filter(Boolean).join(' · ');
}

function MaterialCard({
  resource,
  active,
  onPlay,
}: {
  resource: Resource;
  active: boolean;
  onPlay: () => void;
}) {
  const video = isVideoResource(resource);
  const pdf = resource.type === ResourceType.GDRIVE_PDF;
  const Icon = video ? PlayCircle : pdf ? FileText : Link2;
  const subtitle = video
    ? [active ? 'Now playing' : 'Recording', minutes(resource)].filter(Boolean).join(' · ')
    : pdf
      ? 'PDF · Google Drive'
      : `${resourceKindLabel(resource)} · opens in a new tab`;
  const body = (
    <>
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          video ? 'bg-brand-subtle text-brand-hover' : pdf ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-ink-2',
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold text-ink-1">{resource.label}</span>
        <span className={cn('block truncate text-xs', active ? 'text-brand-hover' : 'text-ink-3')}>{subtitle}</span>
      </span>
      {video ? null : <ExternalLink className="h-4 w-4 shrink-0 text-ink-4" aria-hidden />}
    </>
  );
  const className = cn(
    'flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 transition-colors',
    active ? 'border-brand/50 bg-brand-subtle/40 ring-1 ring-brand/30' : 'border-slate-200/70 hover:border-brand/40',
  );
  return video ? (
    <button type="button" onClick={onPlay} aria-pressed={active} className={className}>
      {body}
    </button>
  ) : (
    <a href={resource.url} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  );
}

export default function LecturePage({ params }: { params: Promise<{ id: string; lectureId: string }> }) {
  const { id: subjectId, lectureId } = React.use(params);
  const router = useRouter();
  const { data: subject, isLoading, isError, error, refetch } = useSubjectDetail(subjectId);
  const profile = useAuthStore((state) => state.profile);

  const located = locateLecture(subject?.sections ?? [], lectureId);
  const resources = located?.lecture.resources ?? [];
  const videos = resources.filter(isVideoResource);
  // The picked recording is remembered per lecture, so navigating resets it.
  const [picked, setPicked] = useState<{ lectureId: string; videoId: string } | null>(null);
  const activeVideo = videos.find((video) => picked?.lectureId === lectureId && video.id === picked.videoId) ?? videos[0];

  const hrefFor = (target: LectureWithResources) => `/subjects/${subjectId}/lectures/${target.id}`;
  const previous = located && located.index > 0 ? located.lectures[located.index - 1] : undefined;
  const next = located && located.index < located.lectures.length - 1 ? located.lectures[located.index + 1] : undefined;

  const lectureTitle = located?.lecture.title;
  const globalIndex = located?.globalIndex;
  useEffect(() => {
    if (!subject || !lectureTitle) return;
    rememberLecture({
      lectureId,
      subjectId: subject.id,
      title: lectureTitle,
      subjectCode: subject.code,
      subjectName: subject.name,
      lectureNumber: globalIndex,
    });
  }, [subject, lectureId, lectureTitle, globalIndex]);

  // J / K: previous / next lecture in this section (ignored while typing).
  const previousHref = previous ? hrefFor(previous) : null;
  const nextHref = next ? hrefFor(next) : null;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if ((event.target as HTMLElement | null)?.closest('input, textarea, [contenteditable="true"]')) return;
      if (event.key === 'j' && previousHref) router.push(previousHref);
      if (event.key === 'k' && nextHref) router.push(nextHref);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previousHref, nextHref, router]);

  if (isLoading) return <LectureSkeleton />;

  if (isError) {
    return (
      <EmptyState
        tone="error"
        title="We couldn’t load this lecture"
        description="Check your connection and try again."
        action={{ label: 'Try again', onClick: () => void refetch() }}
        secondaryAction={{ label: 'Report', href: '/about-us' }}
        code={requestCode(error)}
      />
    );
  }

  if (!subject || !located) {
    return (
      <EmptyState
        icon={Video}
        title="Lecture not found"
        description="It may have been moved or unpublished."
        action={{ label: subject ? `Back to ${subject.code}` : 'Back to Subjects', href: subject ? `/subjects/${subject.id}` : '/subjects' }}
      />
    );
  }

  const { section, sectionIndex, lectures, lecture } = located;
  const youtubeUrl = activeVideo?.type === ResourceType.YOUTUBE ? youtubeWatchUrl(activeVideo.url) : null;
  const recordingSeconds = lectures.reduce((sum, item) => sum + (item.resources?.find(isVideoResource)?.duration_seconds ?? 0), 0);
  const watermark = [profile?.student_id, profile?.full_name ? `${profile.full_name.split(/\s+/)[0]} ${profile.full_name.split(/\s+/)[1]?.[0] ?? ''}.` : null]
    .filter(Boolean)
    .join(' · ');
  const taught = lecture.lecture_date
    ? new Date(`${lecture.lecture_date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify.success('Link copied');
    } catch {
      notify.error('Couldn’t copy the link');
    }
  };

  return (
    <PageTransition className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
      <div className="min-w-0 space-y-5">
        {/* Mobile: back header in place of the app bar */}
        <div className="sticky top-0 z-30 -mx-4 flex items-center gap-2 border-b border-slate-200/70 bg-white/95 px-2 py-2 backdrop-blur-xl sm:-mx-6 lg:hidden">
          <Link
            href={`/subjects/${subject.id}`}
            aria-label={`Back to ${subject.code}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-2 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="min-w-0">
            <span className="block truncate text-xs text-ink-3">
              {subject.code} · Section {sectionIndex + 1}
            </span>
            <span className="block text-sm font-semibold text-ink-1 tabular">
              Lecture {located.globalIndex} of {located.total}
            </span>
          </span>
        </div>

        <div className="hidden items-center justify-between gap-4 lg:flex">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm text-ink-3">
            <Link href="/subjects" className="shrink-0 rounded hover:text-ink-1">
              Subjects
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <Link href={`/subjects/${subject.id}`} className="min-w-0 truncate rounded hover:text-ink-1">
              {subject.code} {subject.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate font-medium text-ink-1">
              Section {sectionIndex + 1} · {section.name}
            </span>
          </nav>
          <p className="hidden shrink-0 items-center gap-1 text-xs text-ink-3 lg:flex">
            <kbd className="rounded border border-slate-200 bg-white px-1 font-sans">J</kbd>
            <kbd className="rounded border border-slate-200 bg-white px-1 font-sans">K</kbd>
            previous · next lecture
          </p>
        </div>

        {activeVideo ? (
          <div className="relative -mx-4 sm:mx-0 [&>div]:rounded-none sm:[&>div]:rounded-2xl">
            <VideoPlayer key={activeVideo.id} resource={activeVideo} lectureTitle={lecture.title} />
            {watermark ? (
              <span className="pointer-events-none absolute right-4 top-3 select-none text-[11px] font-medium text-white/40" aria-hidden>
                {watermark}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white text-center">
            <Video className="h-12 w-12 text-brand/35" aria-hidden />
            <p className="text-sm font-medium text-ink-2">No recording for this lecture</p>
            <p className="text-xs text-ink-3">The slides and links are below.</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-hover tabular">
              Lecture {located.globalIndex} of {located.total}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-1 sm:text-[28px]">{lecture.title}</h1>
            {lecture.description ? (
              <p className="mt-1 whitespace-pre-line text-sm italic leading-relaxed text-ink-3">{lecture.description}</p>
            ) : null}
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-3">
              {lecture.lecturer_name ? (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4" aria-hidden />
                  {lecture.lecturer_name}
                </span>
              ) : null}
              {taught ? (
                <span className="inline-flex items-center gap-1.5 tabular">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  Taught {taught}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" onClick={() => void copyLink()}>
              <Link2 className="h-4 w-4" aria-hidden />
              Copy link
            </Button>
            {youtubeUrl ? (
              <Button asChild variant="secondary" size="sm">
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Open in YouTube
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2 lg:hidden">
          <Button asChild variant="secondary" className="flex-1" disabled={!previous}>
            {previous ? (
              <Link href={hrefFor(previous)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous
              </Link>
            ) : (
              <span aria-disabled>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous
              </span>
            )}
          </Button>
          <Button asChild className="flex-1" disabled={!next}>
            {next ? (
              <Link href={hrefFor(next)}>
                Next lecture
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : (
              <span aria-disabled className="opacity-50">
                Next lecture
                <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            )}
          </Button>
        </div>

        {resources.length > 0 ? (
          <section className="space-y-2" aria-labelledby="materials">
            <h2 id="materials" className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              Materials for this lecture
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {resources.map((resource) => (
                <MaterialCard
                  key={resource.id}
                  resource={resource}
                  active={resource.id === activeVideo?.id}
                  onPlay={() => setPicked({ lectureId, videoId: resource.id })}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start" aria-labelledby="section-lectures">
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle">
          <div className="border-b border-slate-200/70 px-4 py-3">
            <h2 id="section-lectures" className="text-sm font-semibold text-ink-1">
              <span className="lg:hidden">Up next in </span>Section {sectionIndex + 1} · {section.name}
            </h2>
            <p className="text-xs text-ink-3 tabular">
              {lectures.length} {lectures.length === 1 ? 'lecture' : 'lectures'}
              {recordingSeconds > 0 ? ` · ${formatDuration(recordingSeconds)} of recordings` : ''}
            </p>
          </div>
          <ol className="max-h-[60vh] overflow-y-auto p-2">
            {lectures.map((item) => {
              const current = item.id === lecture.id;
              const number = located.globalIndex - located.index + lectures.indexOf(item);
              const summary = lectureSummary(item);
              return (
                <li key={item.id}>
                  <Link
                    href={hrefFor(item)}
                    aria-current={current ? 'page' : undefined}
                    className={cn('flex gap-3 rounded-xl px-3 py-2.5 transition-colors', current ? 'bg-brand-subtle' : 'hover:bg-slate-50')}
                  >
                    <span className={cn('w-5 shrink-0 pt-0.5 text-right text-xs font-medium tabular', current ? 'text-brand-hover' : 'text-ink-3')}>
                      {number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('line-clamp-2 text-[13px] leading-snug', current ? 'font-semibold text-ink-1' : 'font-medium text-ink-2')}>
                        {item.title}
                      </span>
                      {summary || current ? (
                        <span className={cn('block text-[11px] tabular', current ? 'text-brand-hover' : 'text-ink-3')}>
                          {[current ? 'Playing' : null, summary].filter(Boolean).join(' · ')}
                        </span>
                      ) : null}
                    </span>
                    {current ? <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden /> : null}
                  </Link>
                </li>
              );
            })}
          </ol>
          <Link
            href={`/subjects/${subject.id}`}
            className="block border-t border-slate-200/70 px-4 py-3 text-center text-sm font-semibold text-brand-hover hover:text-brand"
          >
            All {subject.sections?.length ?? 0} sections of {subject.code}
          </Link>
        </div>
      </aside>
    </PageTransition>
  );
}
