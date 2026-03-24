'use client';

/**
 * Home Page - Redesigned
 * MedPi Portal main dashboard
 * Uses locale-aware routing
 */

import { useRouter } from '@/i18n/routing';
import { Card, CardBody } from '@nextui-org/react';
import {
  FiVolume2,
  FiBookOpen,
  FiUsers,
  FiStar,
  FiTrendingUp,
} from 'react-icons/fi';
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
      className={`min-w-[130px] px-5 py-2.5 rounded-full border-2 font-semibold text-sm cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md ${colorClass}`}
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
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  onClick: () => void;
  gradientTitle?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-5 cursor-pointer border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg bg-white dark:bg-[#0d1b2e] border-slate-200 dark:border-white/10"
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
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs border border-current font-medium text-slate-500 dark:text-white/50">
            {'>'} ดูเพิ่มเติม {'<'}
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

// Mock announcements data (since no API endpoint exists)
const MOCK_ANNOUNCEMENTS = [
  {
    id: '1',
    title: 'Welcome to MedPi Portal',
    content: 'Welcome to MedPi Portal! Explore your subjects, check your calendar, and stay updated with announcements.',
    date: '2026-03-24',
  },
  {
    id: '2',
    title: 'Midterm Examination Schedule',
    content: 'Midterm examinations will be held from April 7-11, 2026. Please check the Academic Calendar for detailed schedules.',
    date: '2026-03-20',
  },
];

export default function HomePage() {
  const router = useRouter();

  const scrollToAnnouncement = () => {
    const element = document.getElementById('announcement-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION A — Top Two-Column Hero Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        {/* LEFT COLUMN — Announcement Card */}
        <div id="announcement-section">
          <Card className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
            {/* Header bar with gradient */}
            <div className="bg-gradient-to-r from-yellow-300 to-green-300 dark:from-yellow-400/80 dark:to-green-400/80 px-6 py-3">
              <div className="flex items-center gap-2">
                <FiVolume2 className="text-slate-800" size={20} />
                <span className="font-bold text-slate-800 text-lg tracking-wide">ANNOUNCEMENT</span>
              </div>
            </div>
            {/* Body */}
            <CardBody className="min-h-[180px] bg-slate-50 dark:bg-[#0d1b2e] p-4">
              {MOCK_ANNOUNCEMENTS.length > 0 ? (
                <div className="space-y-4">
                  {MOCK_ANNOUNCEMENTS.map((announcement) => (
                    <div key={announcement.id} className="border-b border-slate-200 dark:border-white/10 pb-3 last:border-0 last:pb-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{announcement.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-white/70 mt-1">{announcement.content}</p>
                      <p className="text-xs text-slate-400 dark:text-white/40 mt-2">{announcement.date}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FiVolume2 className="h-12 w-12 text-slate-300 dark:text-white/20 mb-3" />
                  <p className="text-slate-500 dark:text-white/50">No announcements yet.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* RIGHT COLUMN — Year Filter Buttons */}
        <div className="flex lg:flex-col gap-3 flex-wrap lg:flex-nowrap lg:items-end">
          <YearFilterButton
            colorClass="border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-300 dark:border-yellow-400/50"
            onClick={() => router.push('/subjects')}
          >
            Fast track
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300 dark:border-teal-400/50"
            onClick={() => router.push('/subjects?year=1')}
          >
            Year 1
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300 dark:border-teal-400/50"
            onClick={() => router.push('/subjects?year=2')}
          >
            Year 2
          </YearFilterButton>
          <YearFilterButton
            colorClass="border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300 dark:border-teal-400/50"
            onClick={() => router.push('/subjects?year=3')}
          >
            Year 3
          </YearFilterButton>
        </div>
      </div>

      {/* SECTION B — Infinite Horizontal Scrolling Banner */}
      <div className="my-8 relative w-full overflow-hidden py-3">
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {/* Duplicate items twice for seamless loop */}
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-400/10 border border-yellow-300 dark:border-yellow-400/30 text-yellow-700 dark:text-yellow-300 text-sm font-medium shrink-0"
            >
              <FiStar size={14} /> {item}
            </span>
          ))}
        </div>
      </div>

      {/* SECTION C — 4 Feature Navigation Cards (2x2 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
        <FeatureCard
          title="Announcement"
          subtitle="ประกาศข่าวจากฝ่ายวิชาการ"
          icon={<FiVolume2 size={22} />}
          iconBg="bg-yellow-100 dark:bg-yellow-400/10"
          iconColor="text-yellow-500"
          titleColor="text-blue-600 dark:text-blue-400"
          onClick={scrollToAnnouncement}
        />
        <FeatureCard
          title="Academics"
          subtitle="รวมเอกสารวิชาการ"
          icon={<FiBookOpen size={22} />}
          iconBg="bg-purple-100 dark:bg-purple-400/10"
          iconColor="text-purple-500"
          titleColor="text-purple-600 dark:text-purple-400"
          onClick={() => router.push('/subjects')}
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
        />
        <FeatureCard
          title="About Us"
          subtitle="รู้จักกับพวกเรา"
          icon={<FiUsers size={22} />}
          iconBg="bg-teal-100 dark:bg-teal-400/10"
          iconColor="text-teal-500"
          titleColor="text-teal-600 dark:text-teal-400"
          onClick={() => router.push('/about-us')}
        />
      </div>

      {/* SECTION D — Full Calendar */}
      <section className="mt-10">
        <CalendarSection />
      </section>
    </div>
  );
}
