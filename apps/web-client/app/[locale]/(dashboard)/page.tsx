'use client';

/**
 * Home Page - Redesigned
 * MedPi Portal main dashboard
 * Uses locale-aware routing
 */

import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Card, CardBody } from '@nextui-org/react';
import {
  FiVolume2,
  FiBookOpen,
  FiUsers,
  FiStar,
  FiTrendingUp,
  FiArrowRight,
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateShort } from '@medical-portal/shared';
import { CalendarSection } from '@/components/CalendarSection';

// Year filter button component
function YearFilterButton({
  children,
  colorClass,
  onClick,
}: {
  children: React.ReactNode;
  colorClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-w-[122px] px-4 py-2.5 rounded-full border font-semibold text-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] ${colorClass}`}
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
}) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-5 cursor-pointer border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] bg-[var(--bg-surface)] border-slate-200 dark:border-white/10"
    >
      <div className="flex items-start gap-4">
        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          {gradientTitle ? (
            <h3 className="font-bold text-base">
              <span className="text-blue-500 dark:text-blue-300">Learning</span>{' '}
              <span className="text-yellow-400">Hub</span>
            </h3>
          ) : (
            <h3 className={`font-bold text-base ${titleColor}`}>{title}</h3>
          )}
          <p className="text-sm text-slate-500 dark:text-white/50 mt-0.5">{subtitle}</p>
          <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs border font-medium text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.04]">
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

// Loading skeleton for announcement items
function AnnouncementSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="border-b border-slate-200 dark:border-white/10 pb-3 last:border-0 last:pb-0">
          <div className="h-5 bg-slate-200 dark:bg-white/10 rounded w-2/3 mb-2" />
          <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-full mb-1" />
          <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations('home');

  // Fetch real announcements
  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ['announcements', 'dashboard'],
    queryFn: () => api.announcements.list({ page: 1, pageSize: 5 }),
  });
  const announcements = announcementsData?.data?.data ?? [];

  const scrollToAnnouncement = () => {
    const element = document.getElementById('announcement-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION A — Top Two-Column Hero Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        {/* LEFT COLUMN — Announcement Card */}
        <div id="announcement-section">
          <Card className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-[var(--shadow-sm)]">
            {/* Header bar with gradient */}
            <div className="bg-gradient-to-r from-blue-500 to-sky-500 dark:from-blue-500/90 dark:to-sky-400/80 px-6 py-3">
              <div className="flex items-center gap-2">
                <FiVolume2 className="text-white" size={20} />
                <span className="font-bold text-white text-lg tracking-wide">{t('announcement')}</span>
              </div>
            </div>
            {/* Body */}
            <CardBody className="min-h-[180px] bg-slate-50 dark:bg-[var(--bg-surface)] p-4">
              {announcementsLoading ? (
                <AnnouncementSkeleton />
              ) : announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement: { id: string; title: string; content: string; is_pinned: boolean; created_at: string }) => (
                    <div key={announcement.id} className="border-b border-slate-200 dark:border-white/10 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        {announcement.is_pinned && (
                          <span className="text-xs text-yellow-500">📌</span>
                        )}
                        <h4 className="font-semibold text-slate-900 dark:text-white">{announcement.title}</h4>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-white/70 mt-1">{announcement.content}</p>
                      <p className="text-xs text-slate-400 dark:text-white/40 mt-2">{formatDateShort(announcement.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FiVolume2 className="h-12 w-12 text-slate-300 dark:text-white/20 mb-3" />
                  <p className="text-slate-500 dark:text-white/50">{t('noAnnouncement')}</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* RIGHT COLUMN — Year Filter Buttons */}
        <div className="flex lg:flex-col gap-2 flex-wrap lg:flex-nowrap lg:items-end rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-subtle)]">
          <YearFilterButton
            colorClass="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/40"
            onClick={() => router.push('/subjects')}
          >
            {t('fastTrack')}
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/40"
            onClick={() => router.push('/subjects?year=1')}
          >
            {t('year1')}
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/40"
            onClick={() => router.push('/subjects?year=2')}
          >
            {t('year2')}
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/40"
            onClick={() => router.push('/subjects?year=3')}
          >
            {t('year3')}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 text-sm font-medium shrink-0"
            >
              <FiStar size={14} className="text-brand" /> {item}
            </span>
          ))}
        </div>
      </div>

      {/* SECTION C — 4 Feature Navigation Cards (2x2 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FeatureCard
          title={t('announcementCard')}
          subtitle={t('announcementSubtitle')}
          icon={<FiVolume2 size={22} />}
          iconBg="bg-yellow-100 dark:bg-yellow-400/10"
          iconColor="text-yellow-500"
          titleColor="text-blue-600 dark:text-blue-400"
          onClick={scrollToAnnouncement}
          viewMoreText={t('viewMore')}
        />
        <FeatureCard
          title={t('academicsCard')}
          subtitle={t('academicsSubtitle')}
          icon={<FiBookOpen size={22} />}
          iconBg="bg-purple-100 dark:bg-purple-400/10"
          iconColor="text-purple-500"
          titleColor="text-purple-600 dark:text-purple-400"
          onClick={() => router.push('/subjects')}
          viewMoreText={t('viewMore')}
        />
        <FeatureCard
          title=""
          subtitle="Learning Hub"
          icon={<FiTrendingUp size={22} />}
          iconBg="bg-sky-100 dark:bg-sky-400/10"
          iconColor="text-sky-500"
          titleColor=""
          gradientTitle={true}
          onClick={() => router.push('/learning-hub')}
          viewMoreText={t('viewMore')}
        />
        <FeatureCard
          title={t('aboutUsCard')}
          subtitle={t('aboutUsSubtitle')}
          icon={<FiUsers size={22} />}
          iconBg="bg-teal-100 dark:bg-teal-400/10"
          iconColor="text-teal-500"
          titleColor="text-teal-600 dark:text-teal-400"
          onClick={() => router.push('/about-us')}
          viewMoreText={t('viewMore')}
        />
      </div>

      {/* SECTION D — Full Calendar */}
      <section className="mt-10">
        <CalendarSection />
      </section>
    </div>
  );
}
