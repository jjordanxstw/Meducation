'use client';

/**
 * Home Dashboard — editorial-premium layout.
 * HeroUI + Tailwind only.
 */

import { useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chip } from '@heroui/react';
import {
  FiVolume2,
  FiBookOpen,
  FiUsers,
  FiArrowRight,
  FiMapPin,
  FiLayers,
} from 'react-icons/fi';
import { formatDateShort } from '@medical-portal/shared';
import { useAuthStore } from '@/stores/auth.store';
import { CalendarSection } from '@/components/CalendarSection';
import { PageTransition } from '@/components/PageTransition';
import { DataFreshnessDot } from '@/components/ui/DataFreshnessDot';
import { useAnnouncements, useAnnouncementsSeen, type AnnouncementData } from '@/hooks/use-announcements';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const DAY_MS = 24 * 60 * 60 * 1000;

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

const QUICK_FILTERS = [
  { label: 'All Years', href: '/subjects' },
  { label: 'Year 1', href: '/subjects?year=1' },
  { label: 'Year 2', href: '/subjects?year=2' },
  { label: 'Year 3', href: '/subjects?year=3' },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function firstName(full: string | null | undefined): string {
  if (!full) return 'there';
  return full.trim().split(' ')[0];
}

// Loading skeleton for announcement items.
function AnnouncementSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-slate-200/70 p-3 pl-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-slate-200" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Single announcement row with pinned treatment, unread dot, and inline expansion.
function AnnouncementItem({
  announcement,
  seen,
  onSeen,
}: {
  announcement: AnnouncementData;
  seen: boolean;
  onSeen: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const [isUnread] = useState(() => Date.now() - new Date(announcement.created_at).getTime() < DAY_MS);
  const contentRef = useRef<HTMLParagraphElement>(null);

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
          ? 'border border-brand/15 bg-brand-subtle pl-4'
          : 'border-b border-slate-100 px-0 pb-3 last:border-0 last:pb-0'
      }`}
    >
      {announcement.is_pinned && (
        <span className="absolute right-2 top-2 text-brand">
          <FiMapPin size={12} />
        </span>
      )}
      <div className="flex items-center gap-2 pr-6">
        {isUnread && !seen && (
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-brand" aria-label="New" />
        )}
        <h4 className="font-semibold text-slate-900">{announcement.title}</h4>
      </div>
      <p ref={contentRef} className={`mt-1 text-sm leading-relaxed text-slate-600 ${expanded ? '' : 'line-clamp-3'}`}>
        {announcement.content}
      </p>
      {(isClamped || expanded) && (
        <button
          type="button"
          onClick={() => {
            if (!expanded) onSeen();
            setExpanded((prev) => !prev);
          }}
          className="mt-1 text-xs font-semibold text-brand hover:text-brand-hover"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
      <p className="mt-2 text-xs text-slate-400">{formatDateShort(announcement.created_at)}</p>
    </div>
  );
}

// Feature navigation tile — restrained, single-accent.
function FeatureTile({
  title,
  subtitle,
  icon,
  badge,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-5 text-left shadow-subtle transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-soft"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-subtle text-brand">
        {icon}
      </span>
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {badge && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500">{subtitle}</p>
      <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand transition-transform group-hover:translate-x-0.5">
        View more <FiArrowRight size={12} />
      </span>
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { profile, user } = useAuthStore();

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
    document.getElementById('announcement-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const name = firstName(profile?.full_name ?? user?.name);

  return (
    <PageTransition className="space-y-12">
      {/* Greeting header */}
      <header className="space-y-1.5">
        <p className="text-sm font-medium text-brand">{greeting()},</p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{name}</h1>
        <p className="text-base text-slate-500">Pick up where you left off and stay on top of your week.</p>
      </header>

      {/* Hero row: announcements + quick links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Announcements */}
        <section id="announcement-section">
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-subtle">
            <div className="flex items-center gap-2.5 border-b border-slate-200/70 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-subtle text-brand">
                <FiVolume2 size={18} />
              </span>
              <h2 className="font-serif text-lg font-semibold tracking-tight text-slate-900">Announcements</h2>
            </div>
            <div className="relative min-h-[200px] p-5">
              <DataFreshnessDot isFetching={announcementsFetching && !announcementsLoading && !isFetchingNextPage} />
              {announcementsLoading ? (
                <AnnouncementSkeleton />
              ) : announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <AnnouncementItem
                      key={announcement.id}
                      announcement={announcement}
                      seen={isSeen(announcement.id)}
                      onSeen={() => markSeen(announcement.id)}
                    />
                  ))}
                  {isFetchingNextPage && <AnnouncementSkeleton />}
                  <div ref={sentinelRef} aria-hidden className="h-px w-full" />
                  {!hasNextPage && (
                    <p className="py-4 text-center text-xs text-slate-400">All announcements loaded</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FiVolume2 className="mb-3 h-12 w-12 text-slate-300" />
                  <p className="text-slate-500">No announcements yet.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Quick year links */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-subtle">
            <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Jump to subjects
            </p>
            <div className="space-y-2">
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter.href}
                  type="button"
                  onClick={() => router.push(filter.href)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200/70 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-brand/40 hover:bg-brand-subtle hover:text-brand"
                >
                  {filter.label}
                  <FiArrowRight size={14} className="text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Marquee strip */}
      <div
        className="relative overflow-hidden py-1"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
        }}
      >
        <div className="flex w-max animate-marquee gap-2.5">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
            <Chip
              key={index}
              variant="bordered"
              className="shrink-0 border-slate-200 text-slate-500"
            >
              {item}
            </Chip>
          ))}
        </div>
      </div>

      {/* Feature tiles */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FeatureTile
          title="Announcements"
          subtitle="News from the academic office"
          icon={<FiVolume2 size={20} />}
          onClick={scrollToAnnouncement}
        />
        <FeatureTile
          title="Academics"
          subtitle="All academic documents and lectures"
          icon={<FiBookOpen size={20} />}
          onClick={() => router.push('/subjects')}
        />
        <FeatureTile
          title="Learning Hub"
          subtitle="Curated paths and revision materials"
          icon={<FiLayers size={20} />}
          badge="Coming Soon"
          onClick={() => router.push('/learning-hub')}
        />
        <FeatureTile
          title="About Us"
          subtitle="Get to know the team behind the portal"
          icon={<FiUsers size={20} />}
          onClick={() => router.push('/about-us')}
        />
      </section>

      {/* Calendar */}
      <section id="calendar" className="scroll-mt-24">
        <CalendarSection />
      </section>
    </PageTransition>
  );
}
