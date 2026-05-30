'use client';

/**
 * Home Page - Redesigned
 * MedPi Portal main dashboard
 */

import { useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@heroui/react';
import {
  FiVolume2,
  FiBookOpen,
  FiUsers,
  FiStar,
  FiTrendingUp,
  FiArrowRight,
  FiMapPin,
} from 'react-icons/fi';
import { formatDateShort } from '@medical-portal/shared';
import { CalendarSection } from '@/components/CalendarSection';
import { PageTransition } from '@/components/PageTransition';
import { DataFreshnessDot } from '@/components/ui/DataFreshnessDot';
import { useAnnouncements, useAnnouncementsSeen, type AnnouncementData } from '@/hooks/use-announcements';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

// Year filter button component
function YearFilterButton({
  children,
  colorClass,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  colorClass: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 min-w-[122px] px-4 py-2.5 rounded-full border font-semibold text-sm cursor-pointer transition-[background,box-shadow,transform,border-color,color] duration-200 ease-out ${
        active
          ? 'scale-105 border-transparent bg-[#0070F3] text-white shadow-lg shadow-blue-500/25'
          : `${colorClass} hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]`
      }`}
    >
      {children}
    </button>
  );
}

// Feature navigation card component
function FeatureCard({
  title,
  subtitle,
  icon,
  iconBg,
  iconColor,
  titleColor,
  onClick,
  gradientTitle = false,
  viewMoreText,
  badge,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  onClick: () => void;
  gradientTitle?: boolean;
  viewMoreText: string;
  badge?: string;
}) {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl p-5 cursor-pointer border transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] bg-[var(--bg-surface)] border-slate-200 shadow-[var(--shadow-subtle)]"
    >
      <div className="relative z-10 flex items-start gap-4">
        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {gradientTitle ? (
              <h3 className="font-bold text-base">
                <span className="text-blue-500">Learning</span>{' '}
                <span className="text-yellow-400">Hub</span>
              </h3>
            ) : (
              <h3 className={`font-bold text-base ${titleColor}`}>{title}</h3>
            )}
            {badge && (
              <span className="rounded-full border border-amber-500/20 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs border font-medium text-slate-600 border-slate-200 bg-slate-50">
            {viewMoreText} <FiArrowRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
}

// Marquee items
const MARQUEE_ITEMS = [
  'Anatomy I',
  'SCID01',
  'Year 1 · 2 Lectures',
  'Academic Calendar',
  'New Announcements',
  'Learning Hub Coming Soon',
  'Check Your Schedule',
  'Fast Track Available',
];

// Loading skeleton for announcement items — mirrors AnnouncementItem layout
// (pin/dot area, title, three content lines, date) so the card height matches.
function AnnouncementSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="relative rounded-xl border border-slate-200 p-3 pl-4"
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-200" />
            <div className="h-5 w-2/3 rounded bg-slate-200" />
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-11/12 rounded bg-slate-100" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
          </div>
          <div className="mt-3 h-3 w-1/4 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Single announcement row with pinned treatment, unread dot, and inline
// "Read more" expansion for long content.
function AnnouncementItem({
  announcement,
  readMoreLabel,
  showLessLabel,
  seen,
  onSeen,
}: {
  announcement: AnnouncementData;
  readMoreLabel: string;
  showLessLabel: string;
  seen: boolean;
  onSeen: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  // Captured once on mount so the "unread" dot stays stable across re-renders.
  const [isUnread] = useState(
    () => Date.now() - new Date(announcement.created_at).getTime() < DAY_MS,
  );
  const contentRef = useRef<HTMLParagraphElement>(null);

  // Detect whether the content overflows three lines so the toggle only
  // appears when there is genuinely more to read.
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (el) {
      setIsClamped(el.scrollHeight - el.clientHeight > 1);
    }
  }, [announcement.content]);

  return (
    <div
      className={`relative rounded-xl p-3 ${
        announcement.is_pinned
          ? 'border-l-2 border-l-transparent bg-slate-50 pl-4 [border-image:linear-gradient(to_bottom,#0070F3,#7c3aed)_1]'
          : 'border-b border-slate-200 rounded-none px-0 pb-3 last:border-0 last:pb-0'
      }`}
    >
      {announcement.is_pinned && (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 text-blue-400">
          <FiMapPin size={12} />
        </span>
      )}
      <div className="flex items-center gap-2 pr-6">
        {isUnread && !seen && (
          <span
            className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-400"
            aria-label="New"
          />
        )}
        <h4 className="font-semibold text-slate-900">{announcement.title}</h4>
      </div>
      <p
        ref={contentRef}
        className={`mt-1 text-sm text-slate-600 ${expanded ? '' : 'line-clamp-3'}`}
      >
        {announcement.content}
      </p>
      {(isClamped || expanded) && (
        <button
          type="button"
          onClick={() => {
            if (!expanded) onSeen();
            setExpanded((prev) => !prev);
          }}
          className="mt-1 text-xs font-medium text-blue-500 hover:text-blue-600"
        >
          {expanded ? showLessLabel : readMoreLabel}
        </button>
      )}
      <p className="mt-2 text-xs text-slate-400">
        {formatDateShort(announcement.created_at)}
      </p>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  // Fetch real announcements
  const {
    data: announcementsPages,
    isLoading: announcementsLoading,
    isFetching: announcementsFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAnnouncements();
  const { isSeen, markSeen } = useAnnouncementsSeen();
  const announcements = announcementsPages?.pages.flatMap((page) => page.items) ?? [];

  const sentinelRef = useRef<HTMLDivElement>(null);
  useIntersectionObserver(
    sentinelRef,
    () => {
      void fetchNextPage();
    },
    { enabled: Boolean(hasNextPage) && !isFetchingNextPage, rootMargin: '120px' },
  );

  const scrollToAnnouncement = () => {
    const element = document.getElementById('announcement-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <PageTransition className="space-y-8">
      {/* SECTION A — Top Two-Column Hero Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        {/* LEFT COLUMN — Announcement Card */}
        <div id="announcement-section">
          <Card className="rounded-2xl border border-slate-200 overflow-hidden shadow-[var(--shadow-sm)]">
            {/* Header bar with gradient */}
            <div className="bg-gradient-to-r from-blue-500 to-sky-500 px-6 py-3">
              <div className="flex items-center gap-2">
                <FiVolume2 className="text-white" size={20} />
                <span className="font-bold text-white text-lg tracking-wide">ANNOUNCEMENT</span>
              </div>
            </div>
            {/* Body */}
            <CardBody className="relative min-h-[180px] bg-slate-50 p-4">
              <DataFreshnessDot isFetching={announcementsFetching && !announcementsLoading && !isFetchingNextPage} />
              {announcementsLoading ? (
                <AnnouncementSkeleton />
              ) : announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <AnnouncementItem
                      key={announcement.id}
                      announcement={announcement}
                      readMoreLabel="Read more"
                      showLessLabel="Show less"
                      seen={isSeen(announcement.id)}
                      onSeen={() => markSeen(announcement.id)}
                    />
                  ))}
                  {isFetchingNextPage && <AnnouncementSkeleton />}
                  {/* Infinite-scroll sentinel */}
                  <div ref={sentinelRef} aria-hidden className="h-px w-full" />
                  {!hasNextPage && (
                    <p className="py-4 text-center text-xs text-slate-400">All announcements loaded</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FiVolume2 className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-500">No announcements yet.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* RIGHT COLUMN — Year Filter Buttons */}
        <div className="flex lg:flex-col gap-2 overflow-x-auto scrollbar-hide lg:overflow-visible lg:flex-nowrap lg:items-end rounded-2xl border border-slate-200/80 bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-subtle)]">
          <YearFilterButton
            colorClass="border-slate-200 bg-slate-50 text-slate-600 hover:text-blue-600 hover:border-blue-300"
            onClick={() => router.push('/subjects')}
          >
            All Years
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-amber-300 bg-amber-50 text-amber-700"
            onClick={() => router.push('/subjects')}
          >
            Fast track
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-sky-300 bg-sky-50 text-sky-700"
            onClick={() => router.push('/subjects?year=1')}
          >
            Year 1
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-sky-300 bg-sky-50 text-sky-700"
            onClick={() => router.push('/subjects?year=2')}
          >
            Year 2
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-sky-300 bg-sky-50 text-sky-700"
            onClick={() => router.push('/subjects?year=3')}
          >
            Year 3
          </YearFilterButton>
        </div>
      </div>

      {/* SECTION B — Infinite Horizontal Scrolling Banner */}
      <div className="relative w-full overflow-hidden py-2">
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {/* Duplicate items twice for seamless loop */}
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium shrink-0"
            >
              <FiStar size={14} className="text-brand" /> {item}
            </span>
          ))}
        </div>
      </div>

      {/* SECTION C — 4 Feature Navigation Cards (2x2 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FeatureCard
          title="Announcement"
          subtitle="News from the academic office"
          icon={<FiVolume2 size={22} />}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-500"
          titleColor="text-blue-600"
          onClick={scrollToAnnouncement}
          viewMoreText="View More"
        />
        <FeatureCard
          title="Academics"
          subtitle="All academic documents"
          icon={<FiBookOpen size={22} />}
          iconBg="bg-purple-100"
          iconColor="text-purple-500"
          titleColor="text-purple-600"
          onClick={() => router.push('/subjects')}
          viewMoreText="View More"
        />
        <FeatureCard
          title=""
          subtitle="Learning Hub"
          icon={<FiTrendingUp size={22} />}
          iconBg="bg-sky-100"
          iconColor="text-sky-500"
          titleColor=""
          gradientTitle={true}
          badge="Coming Soon"
          onClick={() => router.push('/learning-hub')}
          viewMoreText="View More"
        />
        <FeatureCard
          title="About Us"
          subtitle="Get to know our team"
          icon={<FiUsers size={22} />}
          iconBg="bg-teal-100"
          iconColor="text-teal-500"
          titleColor="text-teal-600"
          onClick={() => router.push('/about-us')}
          viewMoreText="View More"
        />
      </div>

      {/* SECTION D — Full Calendar */}
      <section className="mt-10">
        <CalendarSection />
      </section>
    </PageTransition>
  );
}
