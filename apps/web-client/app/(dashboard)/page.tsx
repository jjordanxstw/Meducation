'use client';

/**
 * Today — the first page after sign-in (Brilliant: Student Desktop / Home,
 * Student Mobile / Today). Announcements first, then news, Continue + the
 * next exam, the student's year and the calendar.
 */

import type * as React from 'react';
import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Newspaper, Pin, Play } from 'lucide-react';
import type { News } from '@medical-portal/shared';
import { PageTransition } from '@/components/PageTransition';
import { SubjectCard } from '@/components/ui/SubjectCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/states/EmptyState';
import { useHotNews } from '@/hooks/use-hot-news';
import { useSubjectDetail, useSubjects } from '@/hooks/use-subjects';
import { daysUntil, useRecentEvents, useUpcomingEvents, type UpcomingEvent } from '@/hooks/use-upcoming';
import { useAnnouncements, useAnnouncementsSeen, type AnnouncementData } from '@/hooks/use-announcements';
import { useRecentlyOpened, type RecentLecture } from '@/lib/recently-opened';
import { useStudyYear } from '@/lib/study-year';
import { formatDay } from '@/lib/dates';
import { primaryVideo, formatDuration } from '@/lib/resources';
import { youtubeThumbnail } from '@/lib/youtube';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const noopSubscribe = () => () => undefined;
const DAY_MS = 86_400_000;

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** "Yesterday", "Today", "3 days ago", else the date. */
function relativeDate(iso: string): string {
  const days = -daysUntil(iso);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDay(iso);
}

function timeRange(event: UpcomingEvent): string | null {
  if (!event.start_time) return null;
  const start = event.start_time.slice(0, 5);
  return event.end_time ? `${start}–${event.end_time.slice(0, 5)}` : start;
}

function SectionHeading({ title, extra, href, linkLabel }: { title: string; extra?: React.ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink-1">
        {title}
        {extra}
      </h2>
      {href ? (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-hover hover:text-brand">
          {linkLabel ?? 'See all'}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

function CategoryLine({ article }: { article: News }) {
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-[11px]">
      {article.category ? (
        <>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: article.category.color }} aria-hidden />
          <span className="font-semibold uppercase tracking-wider" style={{ color: article.category.color }}>
            {article.category.name}
          </span>
          <span className="text-ink-3">·</span>
        </>
      ) : null}
      <span className="truncate text-ink-3">{relativeDate(article.published_at)}</span>
    </p>
  );
}

function NewsCover({ article, className }: { article: News; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-[#1e3a5f]', className)}>
      {article.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.cover_image_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Newspaper className="h-9 w-9 text-white/25" aria-hidden />
        </div>
      )}
    </div>
  );
}

/* ---------------- News ---------------- */

function LatestNews() {
  const { data: articles = [], isLoading } = useHotNews(12);
  const [slide, setSlide] = useState(0);
  const [now] = useState(() => Date.now());
  const newThisWeek = articles.filter((article) => now - new Date(article.published_at).getTime() < 7 * DAY_MS).length;
  const featured = articles.find((article) => article.is_featured) ?? articles[0];
  const rest = articles.filter((article) => article.id !== featured?.id);

  return (
    <section className="space-y-3" aria-labelledby="latest-news">
      <SectionHeading
        title="Latest news"
        extra={
          newThisWeek > 0 ? (
            <span className="rounded-md bg-brand-subtle px-1.5 py-0.5 text-[11px] font-semibold text-brand-hover">{newThisWeek} new this week</span>
          ) : null
        }
        href="/news"
        linkLabel="All news"
      />
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[1.75fr_1fr]">
          <Skeleton className="h-56 rounded-2xl" />
          <div className="hidden flex-col gap-4 lg:flex">
            <Skeleton className="h-[104px] rounded-2xl" />
            <Skeleton className="h-[104px] rounded-2xl" />
          </div>
        </div>
      ) : !featured ? (
        <EmptyState compact icon={Newspaper} title="No news yet" description="Faculty news shows up here first." />
      ) : (
        <>
          {/* Desktop: lead story + two compact stories */}
          <div className="hidden gap-4 lg:grid lg:grid-cols-[1.75fr_1fr]">
            <Link
              href={`/news/${featured.id}`}
              className="group grid min-h-[220px] grid-cols-[0.75fr_1fr] overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle transition-all hover:border-brand/40 hover:shadow-soft"
            >
              <div className="relative">
                <NewsCover article={featured} className="absolute inset-0" />
                {featured.is_featured ? (
                  <span className="absolute left-3 top-3 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-brand-hover">Featured</span>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 p-5">
                <CategoryLine article={featured} />
                <h3 className="text-lg font-semibold leading-snug tracking-tight text-ink-1 group-hover:text-brand-hover">{featured.title}</h3>
                {featured.summary ? <p className="line-clamp-3 text-sm leading-relaxed text-ink-2">{featured.summary}</p> : null}
                <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-brand-hover">
                  Read
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </div>
            </Link>
            <div className="flex flex-col gap-4">
              {rest.slice(0, 2).map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="group flex flex-1 gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-subtle transition-all hover:border-brand/40 hover:shadow-soft"
                >
                  <NewsCover article={article} className="w-24 shrink-0 rounded-lg !bg-brand-subtle" />
                  <div className="flex min-w-0 flex-col justify-center gap-1">
                    <CategoryLine article={article} />
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink-1 group-hover:text-brand-hover">{article.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile: swipeable carousel with dots */}
          <div className="lg:hidden">
            <div
              className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide sm:-mx-6 sm:scroll-px-6 sm:px-6"
              aria-label="Latest news"
              onScroll={(event) => {
                const el = event.currentTarget;
                const card = el.firstElementChild as HTMLElement | null;
                if (card) setSlide(Math.round(el.scrollLeft / (card.offsetWidth + 12)));
              }}
            >
              {[featured, ...rest.slice(0, 3)].map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="w-[84%] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle sm:w-[48%]"
                >
                  <div className="relative">
                    <NewsCover article={article} className="aspect-[16/9]" />
                    {article.is_featured ? (
                      <span className="absolute left-3 top-3 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-brand-hover">Featured</span>
                    ) : null}
                  </div>
                  <div className="space-y-1 p-3.5">
                    <CategoryLine article={article} />
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink-1">{article.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
              {[featured, ...rest.slice(0, 3)].map((article, index) => (
                <span key={article.id} className={cn('h-1.5 rounded-full transition-all', index === slide ? 'w-4 bg-brand' : 'w-1.5 bg-slate-300')} />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------- Continue ---------------- */

function ContinueCard({ recent }: { recent: RecentLecture }) {
  const { data: subject } = useSubjectDetail(recent.subjectId);
  const ordered = (subject?.sections ?? []).flatMap((section, sectionIndex) =>
    (section.lectures ?? []).map((lecture) => ({ lecture, sectionIndex })),
  );
  const index = ordered.findIndex((entry) => entry.lecture.id === recent.lectureId);
  const current = index >= 0 ? ordered[index] : undefined;
  const next = index >= 0 ? ordered[index + 1] : undefined;
  const video = current ? primaryVideo(current.lecture) : undefined;
  const thumbnail = video ? youtubeThumbnail(video.url) : null;
  const duration = formatDuration(video?.duration_seconds);
  const href = `/subjects/${recent.subjectId}/lectures/${recent.lectureId}`;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-subtle sm:flex-row sm:items-center sm:p-5">
      <Link
        href={href}
        className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#14284a] sm:w-56"
        aria-label={`Resume ${recent.title}`}
      >
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        ) : null}
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lift">
          <Play className="ml-0.5 h-5 w-5 fill-brand text-brand" aria-hidden />
        </span>
        {duration ? (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white tabular">{duration}</span>
        ) : null}
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-hover">Continue where you left off</p>
        <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-ink-1">{recent.title}</h3>
        <p className="mt-1 text-sm text-ink-3 tabular">
          {[recent.subjectCode, current ? `Section ${current.sectionIndex + 1}` : null, index >= 0 ? `Lecture ${index + 1} of ${ordered.length}` : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {current?.lecture.lecturer_name ? <p className="text-sm text-ink-3">{current.lecture.lecturer_name}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={href}>
              <Play className="h-4 w-4 fill-current" aria-hidden />
              Resume
            </Link>
          </Button>
          {next ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/subjects/${recent.subjectId}/lectures/${next.lecture.id}`}>
                Next: Lecture {index + 2}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Next exam ---------------- */

function NextExamCard({ exam, compact }: { exam: UpcomingEvent; compact?: boolean }) {
  const days = daysUntil(exam.start_date);
  const when = [formatDay(exam.start_date), timeRange(exam)?.split('–')[0], exam.location].filter(Boolean).join(' · ');

  if (compact) {
    return (
      <Link href="/calendar" className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-subtle">
        <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-red-50 text-red-700">
          <span className="text-xl font-bold leading-none tabular">{days}</span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase">{days === 1 ? 'day' : 'days'}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink-1">{exam.title}</span>
          <span className="block truncate text-sm text-ink-3">{when}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-4" aria-hidden />
      </Link>
    );
  }

  return (
    <Link href="/calendar" className="flex flex-col rounded-2xl border border-slate-200/70 bg-white p-5 shadow-subtle transition-all hover:shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-red-700">Next exam</p>
        <p className="truncate text-xs text-ink-3 tabular">{when}</p>
      </div>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-5xl font-bold tracking-tight text-ink-1 tabular">{days === 0 ? 'Today' : days}</span>
        {days > 0 ? <span className="text-base font-medium text-ink-2">{days === 1 ? 'day' : 'days'}</span> : null}
      </p>
      <p className="mt-2 text-[15px] font-semibold text-ink-1">{exam.title}</p>
      {exam.description ? <p className="line-clamp-1 text-sm text-ink-3">{exam.description}</p> : null}
    </Link>
  );
}

/* ---------------- Announcements + Coming up ---------------- */

function AnnouncementRow({ announcement, seen, onSeen }: { announcement: AnnouncementData; seen: boolean; onSeen: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [isNew] = useState(() => Date.now() - new Date(announcement.created_at).getTime() < 3 * DAY_MS);
  return (
    <li>
      <button
        type="button"
        onClick={() => {
          setExpanded((value) => !value);
          onSeen();
        }}
        aria-expanded={expanded}
        className="flex w-full gap-3 py-3 text-left"
      >
        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
          {announcement.is_pinned ? (
            <Pin className="h-4 w-4 fill-brand text-brand" aria-label="Pinned" />
          ) : isNew && !seen ? (
            <span className="h-2.5 w-2.5 rounded-full bg-brand" aria-label="New" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full border border-slate-300" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block text-sm font-semibold', seen && !announcement.is_pinned ? 'text-ink-2' : 'text-ink-1')}>{announcement.title}</span>
          {expanded ? <span className="mt-1 block whitespace-pre-line text-sm text-ink-2">{announcement.content}</span> : null}
          <span className="block text-xs text-ink-3 tabular">
            {announcement.is_pinned ? 'Pinned · ' : isNew && !seen ? 'New · ' : ''}
            {relativeDate(announcement.created_at)}
          </span>
        </span>
      </button>
    </li>
  );
}

function Announcements() {
  const { data, isLoading } = useAnnouncements(10);
  const { isSeen, markSeen } = useAnnouncementsSeen();
  const [showAll, setShowAll] = useState(false);
  const items = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.items) ?? [];
    return [...all.filter((item) => item.is_pinned), ...all.filter((item) => !item.is_pinned)];
  }, [data]);

  // Announcements sit at the top of Today, so an empty card would just be noise.
  if (!isLoading && items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-subtle" aria-labelledby="announcements">
      <div className="flex items-center justify-between">
        <h2 id="announcements" className="text-base font-semibold text-ink-1">
          Announcements
        </h2>
        {items.length > 3 ? (
          <button type="button" onClick={() => setShowAll((value) => !value)} className="text-sm font-semibold text-brand-hover hover:text-brand">
            {showAll ? 'Show less' : 'View all'}
          </button>
        ) : null}
      </div>
      {isLoading ? (
        <div className="mt-3 space-y-3">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      ) : (
        <ul className="mt-1 divide-y divide-slate-100">
          {(showAll ? items : items.slice(0, 3)).map((item) => (
            <AnnouncementRow key={item.id} announcement={item} seen={isSeen(item.id)} onSeen={() => markSeen(item.id)} />
          ))}
        </ul>
      )}
    </section>
  );
}

const CALENDAR_ROWS = 4;

/**
 * The next few events; when fewer than four are ahead, the most recent past
 * ones fill the list so it never looks empty. Shown in date order, past ones
 * muted and labelled.
 */
function ComingUp({ upcoming, recent, isLoading }: { upcoming: UpcomingEvent[]; recent: UpcomingEvent[]; isLoading: boolean }) {
  const ahead = upcoming.slice(0, CALENDAR_ROWS);
  const past = recent.slice(0, CALENDAR_ROWS - ahead.length).reverse();
  const rows = [...past.map((event) => ({ event, isPast: true })), ...ahead.map((event) => ({ event, isPast: false }))];
  const title = past.length === 0 ? 'Coming up' : ahead.length === 0 ? 'Latest on the calendar' : 'On the calendar';

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-subtle" aria-labelledby="coming-up">
      <div className="flex items-center justify-between">
        <h2 id="coming-up" className="text-base font-semibold text-ink-1">
          {title}
        </h2>
        <Link href="/calendar" className="text-sm font-semibold text-brand-hover hover:text-brand">
          Calendar
        </Link>
      </div>
      {isLoading ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-11 rounded-lg" />
          <Skeleton className="h-11 rounded-lg" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-3">Nothing on the calendar yet.</p>
      ) : (
        <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
          {rows.map(({ event, isPast }) => {
            const date = new Date(`${event.start_date.slice(0, 10)}T00:00:00`);
            const isExam = event.type === 'exam';
            return (
              <li key={event.id} className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-0">
                <span className={cn('w-10 shrink-0 text-center leading-tight', isPast ? 'text-ink-3' : isExam ? 'text-red-700' : 'text-ink-1')}>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider">
                    {date.toLocaleDateString('en-GB', { month: 'short' })}
                  </span>
                  <span className="block text-xl font-bold tabular">{date.getDate()}</span>
                </span>
                <span
                  className={cn('h-9 w-[3px] shrink-0 rounded-full', isPast && 'opacity-40')}
                  style={{ backgroundColor: event.color ?? '#2f80ed' }}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className={cn('block truncate text-sm font-semibold', isPast ? 'text-ink-2' : 'text-ink-1')}>{event.title}</span>
                  <span className="block truncate text-xs text-ink-3">
                    {isPast ? <span className="font-semibold">Past · </span> : null}
                    <span className="capitalize">{[event.type, timeRange(event) ?? 'all day', event.location].filter(Boolean).join(' · ')}</span>
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------------- Page ---------------- */

export default function TodayPage() {
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const { year } = useStudyYear();
  const [latestRecent] = useRecentlyOpened();
  const { data: events = [], isLoading: eventsLoading } = useUpcomingEvents(20);
  // Past events only matter when fewer than four are ahead.
  const needPast = !eventsLoading && events.length < CALENDAR_ROWS;
  const { data: recentEvents = [], isLoading: recentLoading } = useRecentEvents(CALENDAR_ROWS, needPast);
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects({ yearLevel: 'all' });
  const hour = useSyncExternalStore(noopSubscribe, () => new Date().getHours(), () => 9);

  const firstName = (profile?.full_name ?? user?.name ?? '').trim().split(/\s+/)[0] || 'there';
  const exam = events.find((event) => event.type === 'exam');
  const examDays = exam ? daysUntil(exam.start_date) : null;
  const mySubjects = useMemo(() => {
    const pool = year ? subjects.filter((subject) => subject.year_level === year) : subjects;
    return [...pool].sort((a, b) => (b.latest_lecture_at ?? '').localeCompare(a.latest_lecture_at ?? '')).slice(0, 4);
  }, [subjects, year]);
  const newLectures = mySubjects.reduce((sum, subject) => sum + subject.new_lectures_count, 0);

  const summary = [
    newLectures > 0 ? `${newLectures} new ${newLectures === 1 ? 'lecture' : 'lectures'} in your subjects this week.` : null,
    exam && examDays !== null ? `${exam.title} ${examDays === 0 ? 'is today' : `in ${examDays} ${examDays === 1 ? 'day' : 'days'}`}.` : null,
  ].filter(Boolean);

  return (
    <PageTransition className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-1 sm:text-4xl">
          {greeting(hour)}, {firstName}
        </h1>
        {summary.length > 0 ? <p className="mt-1 text-sm text-ink-2 sm:text-base">{summary.join(' ')}</p> : null}
      </header>

      <Announcements />

      <LatestNews />

      {latestRecent || exam ? (
        <div className={cn('grid gap-4', latestRecent && exam && 'lg:grid-cols-[2fr_1fr]')}>
          {latestRecent ? <ContinueCard recent={latestRecent} /> : null}
          {exam ? (
            <>
              <div className="hidden lg:block">
                <NextExamCard exam={exam} />
              </div>
              <div className="lg:hidden">
                <NextExamCard exam={exam} compact />
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <section className="space-y-3" aria-labelledby="your-subjects">
        <SectionHeading
          title={year ? `Your Year ${year} subjects` : 'Subjects'}
          href={year ? `/subjects?year=${year}` : '/subjects?year=all'}
          linkLabel="All subjects"
        />
        {subjectsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className={cn('aspect-[5/4] rounded-2xl', i > 1 && 'hidden lg:block')} />
            ))}
          </div>
        ) : mySubjects.length === 0 ? (
          <EmptyState compact title="No subjects for your year yet" action={{ label: 'Browse all subjects', href: '/subjects?year=all' }} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {mySubjects.map((subject, index) => (
              <SubjectCard
                key={subject.id}
                variant="compact"
                id={subject.id}
                code={subject.code}
                name={subject.name}
                thumbnailUrl={subject.thumbnail_url}
                sectionsCount={subject.sections_count}
                lecturesCount={subject.lectures_count}
                newLecturesCount={subject.new_lectures_count}
                className={cn(index > 1 && 'hidden lg:flex')}
              />
            ))}
          </div>
        )}
      </section>

      <ComingUp upcoming={events} recent={recentEvents} isLoading={eventsLoading || (needPast && recentLoading)} />
    </PageTransition>
  );
}
