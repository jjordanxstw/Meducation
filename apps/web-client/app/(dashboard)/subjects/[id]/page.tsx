'use client';

/**
 * Subject detail (Brilliant: Student Desktop / Subject detail). Header chips,
 * "Play newest lecture", material tabs, and every section as a lecture table
 * numbered across the whole subject.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { BookOpen, ChevronRight, Link2, Play, Search, Video, X } from 'lucide-react';
import { ResourceType } from '@medical-portal/shared';
import type { LectureWithResources, SectionWithLectures } from '@medical-portal/shared';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { HighlightText } from '@/components/ui/HighlightText';
import { PageTransition } from '@/components/PageTransition';
import { EmptyState } from '@/components/states/EmptyState';
import { requestCode } from '@/lib/request-code';
import { useSubjectDetail } from '@/hooks/use-subjects';
import { useDebounce } from '@/hooks/use-debounce';
import { daysUntil, useUpcomingEvents } from '@/hooks/use-upcoming';
import { cn } from '@/lib/utils';
import { isNewLecture, isVideoResource, primaryVideo } from '@/lib/resources';

type Tab = 'all' | 'videos' | 'files';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'all', label: 'All materials' },
  { key: 'videos', label: 'Videos' },
  { key: 'files', label: 'Slides & PDFs' },
];

function lectureHref(subjectId: string, lectureId: string) {
  return `/subjects/${subjectId}/lectures/${lectureId}`;
}

function taughtDate(value: string | null): string {
  if (!value) return '–';
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function updatedAgo(iso: string | null): string | null {
  if (!iso) return null;
  const days = -daysUntil(iso);
  if (days <= 0) return 'updated today';
  if (days === 1) return 'updated yesterday';
  if (days < 30) return `updated ${days} days ago`;
  return `updated ${new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}

function MaterialChips({ subjectId, lecture, tab }: { subjectId: string; lecture: LectureWithResources; tab: Tab }) {
  const video = primaryVideo(lecture);
  const minutes = video?.duration_seconds ? Math.round(video.duration_seconds / 60) : null;
  const pdfs = (lecture.resources ?? []).filter((resource) => resource.type === ResourceType.GDRIVE_PDF);
  const links = (lecture.resources ?? []).filter((resource) => resource.type === ResourceType.EXTERNAL);

  return (
    <div className="relative z-10 flex flex-wrap items-center gap-1.5">
      {video && tab !== 'files' ? (
        <Link
          href={lectureHref(subjectId, lecture.id)}
          aria-label={`Watch ${lecture.title}`}
          className="inline-flex h-6 items-center gap-1 rounded-md bg-brand-subtle px-1.5 text-xs font-semibold text-brand-hover transition-colors hover:bg-brand/15 tabular"
        >
          <Play className="h-3 w-3 fill-current" aria-hidden />
          {minutes ? `${minutes}m` : 'Watch'}
        </Link>
      ) : null}
      {tab !== 'videos'
        ? pdfs.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              title={resource.label}
              className="inline-flex h-6 items-center rounded-md bg-red-50 px-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              PDF
            </a>
          ))
        : null}
      {tab !== 'videos' && links.length > 0 ? (
        <a
          href={links[0].url}
          target="_blank"
          rel="noopener noreferrer"
          title={links.map((link) => link.label).join(', ')}
          className="inline-flex h-6 items-center gap-1 rounded-md bg-slate-100 px-1.5 text-xs font-semibold text-ink-2 transition-colors hover:bg-slate-200"
        >
          <Link2 className="h-3 w-3" aria-hidden />
          {links.length}
        </a>
      ) : null}
    </div>
  );
}

/** Mobile row line (Brilliant: Mobile — Subject detail): "47 min · PDF · 1 Sep". */
function mobileSummary(lecture: LectureWithResources): string {
  const video = primaryVideo(lecture);
  const hasPdf = (lecture.resources ?? []).some((resource) => resource.type === ResourceType.GDRIVE_PDF);
  const date = lecture.lecture_date
    ? new Date(`${lecture.lecture_date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null;
  return [video?.duration_seconds ? `${Math.round(video.duration_seconds / 60)} min` : null, hasPdf ? 'PDF' : null, date]
    .filter(Boolean)
    .join(' · ');
}

function sectionCounts(section: SectionWithLectures) {
  const lectures = section.lectures?.length ?? 0;
  const files = (section.lectures ?? []).reduce(
    (sum, lecture) => sum + (lecture.resources ?? []).filter((resource) => !isVideoResource(resource)).length,
    0,
  );
  return { lectures, files };
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-4 w-40 rounded" />
      <Skeleton className="h-6 w-56 rounded" />
      <Skeleton className="h-10 w-2/3 rounded" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
  );
}

export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: subject = null, isLoading, isError, error, refetch } = useSubjectDetail(id);
  const { data: upcoming = [] } = useUpcomingEvents(20);
  const [tab, setTab] = useState<Tab>('all');
  const [filter, setFilter] = useState('');
  const debouncedFilter = useDebounce(filter, 200);
  const [openKeys, setOpenKeys] = useState<string[] | null>(null);

  const sections = useMemo(() => subject?.sections ?? [], [subject]);

  // Lecture numbers run across the whole subject ("Lecture 7 of 24").
  const numbering = useMemo(() => {
    const map = new Map<string, number>();
    let n = 0;
    for (const section of sections) for (const lecture of section.lectures ?? []) map.set(lecture.id, ++n);
    return map;
  }, [sections]);

  const all = useMemo(() => sections.flatMap((section) => section.lectures ?? []), [sections]);
  const newest = useMemo(
    () => all.filter((lecture) => primaryVideo(lecture)).sort((a, b) => b.created_at.localeCompare(a.created_at))[0],
    [all],
  );
  const latestUpload = useMemo(() => all.reduce<string | null>((max, l) => (!max || l.created_at > max ? l.created_at : max), null), [all]);
  const totalFiles = useMemo(() => sections.reduce((sum, section) => sum + sectionCounts(section).files, 0), [sections]);

  const exam = upcoming.find((event) => event.type === 'exam' && event.subject_id === id);
  const examDays = exam ? daysUntil(exam.start_date) : null;

  const query = debouncedFilter.trim().toLowerCase();
  const visibleSections = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          lectures: (section.lectures ?? []).filter((lecture) => {
            if (tab === 'videos' && !primaryVideo(lecture)) return false;
            if (tab === 'files' && !(lecture.resources ?? []).some((r) => !isVideoResource(r))) return false;
            if (!query) return true;
            return lecture.title.toLowerCase().includes(query) || (lecture.lecturer_name ?? '').toLowerCase().includes(query);
          }),
        }))
        .filter((section) => section.lectures.length > 0 || (!query && tab === 'all')),
    [sections, tab, query],
  );

  if (isLoading) return <DetailSkeleton />;

  if (isError || !subject) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const notFound = status === 404 || (!isError && !subject);
    return (
      <PageTransition className="mx-auto max-w-2xl">
        <EmptyState
          tone={notFound ? 'neutral' : 'error'}
          icon={notFound ? BookOpen : undefined}
          title={notFound ? 'Subject not found' : 'We couldn’t load this subject'}
          description={notFound ? 'It may have been moved, renamed or unpublished.' : 'Check your connection and try again.'}
          action={notFound ? { label: 'Back to Subjects', href: '/subjects' } : { label: 'Try again', onClick: () => void refetch() }}
          secondaryAction={notFound ? undefined : { label: 'Report', href: '/about-us' }}
          code={notFound ? null : requestCode(error)}
        />
      </PageTransition>
    );
  }

  const filtering = Boolean(query) || tab !== 'all';
  const allKeys = visibleSections.map((section) => section.id);
  const effectiveOpen = filtering ? allKeys : openKeys ?? (sections[0] ? [sections[0].id] : []);
  const allOpen = effectiveOpen.length === allKeys.length;

  return (
    <PageTransition className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-ink-3">
        <Link href="/subjects" className="rounded hover:text-ink-1">
          Subjects
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link href={`/subjects?year=${subject.year_level}`} className="rounded font-medium text-ink-2 hover:text-ink-1">
          Year {subject.year_level}
        </Link>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-ink-1">{subject.code}</span>
            <span className="rounded-md bg-brand-subtle px-1.5 py-0.5 text-xs font-semibold text-brand-hover">Year {subject.year_level}</span>
            {exam && examDays !== null ? (
              <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                {exam.title} {examDays === 0 ? 'today' : `in ${examDays} ${examDays === 1 ? 'day' : 'days'}`}
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-1 sm:text-4xl">{subject.name}</h1>
          <p className="mt-1 text-sm text-ink-3 tabular">
            {[`${sections.length} sections`, `${all.length} lectures`, `${totalFiles} files`, updatedAgo(latestUpload)].filter(Boolean).join(' · ')}
          </p>
        </div>
        {newest ? (
          <Button asChild className="shrink-0">
            <Link href={lectureHref(subject.id, newest.id)}>
              <Play className="h-4 w-4 fill-current" aria-hidden />
              Play newest lecture
            </Link>
          </Button>
        ) : null}
      </header>

      {sections.length === 0 ? (
        <EmptyState icon={Video} title="No lectures yet" description="Lectures for this subject appear here as soon as they are uploaded." />
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex w-fit gap-0.5 rounded-xl bg-slate-200/60 p-1" role="group" aria-label="Show">
              {TABS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={tab === option.key}
                  onClick={() => setTab(option.key)}
                  className={cn(
                    'h-8 rounded-lg px-3 text-sm transition-colors',
                    tab === option.key ? 'bg-white font-semibold text-ink-1 shadow-subtle' : 'font-medium text-ink-2 hover:text-ink-1',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                aria-label={`Filter lectures in ${subject.code}`}
                placeholder={`Filter lectures in ${subject.code}`}
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                startContent={<Search className="h-4 w-4" />}
                endContent={
                  filter ? (
                    <button
                      type="button"
                      aria-label="Clear filter"
                      onClick={() => setFilter('')}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-ink-3 hover:bg-slate-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null
                }
                wrapperClassName="w-full md:w-72"
              />
              <Button variant="secondary" className="shrink-0" disabled={filtering} onClick={() => setOpenKeys(allOpen ? [] : allKeys)}>
                {allOpen ? 'Collapse all' : 'Expand all'}
              </Button>
            </div>
          </div>

          {visibleSections.length === 0 ? (
            <EmptyState
              compact
              icon={Search}
              title={query ? `No lectures match “${debouncedFilter.trim()}”` : 'Nothing here yet'}
              action={{
                label: 'Show everything',
                onClick: () => {
                  setFilter('');
                  setTab('all');
                },
              }}
            />
          ) : (
            <Accordion type="multiple" value={effectiveOpen} onValueChange={(keys) => setOpenKeys(keys)} className="flex flex-col gap-3">
              {visibleSections.map((section) => {
                const counts = sectionCounts(section);
                const sectionNumber = sections.findIndex((s) => s.id === section.id) + 1;
                return (
                  <AccordionItem key={section.id} value={section.id}>
                    <AccordionTrigger aria-label={section.name}>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-ink-2 tabular">
                          {sectionNumber}
                        </span>
                        <span className="min-w-0 text-left">
                          <span className="block truncate text-[15px] font-semibold text-ink-1">{section.name}</span>
                          <span className="block text-xs font-normal text-ink-3 tabular">
                            {counts.lectures} {counts.lectures === 1 ? 'lecture' : 'lectures'} · {counts.files} {counts.files === 1 ? 'file' : 'files'}
                          </span>
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-1">
                      {section.lectures.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-ink-3">No lectures in this section yet.</p>
                      ) : (
                        <div role="table" aria-label={`${section.name} lectures`} className="text-left">
                          <div
                            role="row"
                            className="hidden grid-cols-[3rem_minmax(0,1fr)_8rem_12rem] border-y border-slate-100 bg-slate-50/60 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3 md:grid"
                          >
                            <span role="columnheader" className="pl-4">#</span>
                            <span role="columnheader">Lecture</span>
                            <span role="columnheader">Taught</span>
                            <span role="columnheader" className="pr-4">Materials</span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {section.lectures.map((lecture) => (
                              <div
                                key={lecture.id}
                                role="row"
                                className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 transition-colors hover:bg-slate-50 md:grid-cols-[3rem_minmax(0,1fr)_8rem_12rem] md:px-0"
                              >
                                <span role="cell" className="hidden pl-4 text-sm text-ink-3 tabular md:block">
                                  {numbering.get(lecture.id)}
                                </span>
                                <div role="cell" className="min-w-0">
                                  <Link
                                    href={lectureHref(subject.id, lecture.id)}
                                    className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-ink-1 after:absolute after:inset-0 group-hover:text-brand-hover"
                                  >
                                    <span className="text-ink-3 tabular md:hidden">{numbering.get(lecture.id)}.</span>
                                    <HighlightText text={lecture.title} query={debouncedFilter} />
                                    {isNewLecture(lecture.created_at) ? (
                                      <span className="rounded bg-brand-subtle px-1 text-[10px] font-bold uppercase tracking-wide text-brand-hover">New</span>
                                    ) : null}
                                  </Link>
                                  {lecture.lecturer_name ? <p className="hidden text-xs text-ink-3 md:block">{lecture.lecturer_name}</p> : null}
                                  <p className="text-xs text-ink-3 tabular md:hidden">{mobileSummary(lecture)}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-ink-4 md:hidden" aria-hidden />
                                <span role="cell" className="hidden text-sm text-ink-2 tabular md:block">
                                  {taughtDate(lecture.lecture_date)}
                                </span>
                                <div role="cell" className="hidden md:block md:pr-4">
                                  <MaterialChips subjectId={subject.id} lecture={lecture} tab={tab} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </>
      )}
    </PageTransition>
  );
}
