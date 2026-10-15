'use client';

/**
 * MainLayout — protected app shell (Brilliant: Student Desktop / Mobile).
 *
 * Desktop (≥ lg): left sidebar (logo, "Studying Year N" picker, nav with the
 * exam countdown badge, Recently opened, user block) + slim top bar (search,
 * today's date). Lecture pages switch to a narrow icon rail for focus.
 * Mobile (< lg): top bar (logo, year chip, avatar) + bottom nav
 * (Today, Subjects, Calendar, Search, Me).
 */

import type * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { signOut, useSession } from 'next-auth/react';
import {
  BookOpen,
  CalendarDays,
  CircleUser,
  Info,
  Layers,
  LogOut,
  MoreHorizontal,
  Newspaper,
  PlayCircle,
  Plus,
  Search,
  Sunrise,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { forgetRecentlyOpened, useRecentlyOpened } from '@/lib/recently-opened';
import { useStudyYear } from '@/lib/study-year';
import { daysUntil, useUpcomingEvents } from '@/hooks/use-upcoming';
import { useAuthStore } from '@/stores/auth.store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommandPalette, useCommandPaletteShortcut } from '@/components/search/CommandPalette';

type NavItem = { name: string; href: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { name: 'Today', href: '/', icon: Sunrise },
  { name: 'Subjects', href: '/subjects', icon: Layers },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Learning Hub', href: '/learning-hub', icon: BookOpen },
  { name: 'News', href: '/news', icon: Newspaper },
];

const BOTTOM_NAV: NavItem[] = [
  { name: 'Today', href: '/', icon: Sunrise },
  { name: 'Subjects', href: '/subjects', icon: Layers },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Me', href: '/about-me', icon: CircleUser },
];

const noopSubscribe = () => () => undefined;

function isRouteActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string | undefined | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center justify-center rounded-lg bg-brand text-white', className)}>
      <Plus className="h-[60%] w-[60%]" strokeWidth={3} aria-hidden />
    </span>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="MedPi home">
      <LogoMark className="h-9 w-9" />
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-tight text-ink-1">MedPi</span>
        <span className="block text-[11px] text-ink-3">Lecture library</span>
      </span>
    </Link>
  );
}

/** Days to the next exam, for the Calendar badge (only within two weeks). */
function useExamCountdown(): number | null {
  const { data: events = [] } = useUpcomingEvents(20);
  const exam = events.find((event) => event.type === 'exam');
  if (!exam) return null;
  const days = daysUntil(exam.start_date);
  return days >= 0 && days <= 14 ? days : null;
}

function SidebarNav({ pathname, examIn }: { pathname: string; examIn: number | null }) {
  return (
    <nav className="space-y-0.5" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = isRouteActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
              active ? 'bg-brand-subtle font-semibold text-brand-hover' : 'font-medium text-ink-2 hover:bg-slate-100 hover:text-ink-1',
            )}
          >
            <Icon className={cn('h-[18px] w-[18px]', active ? 'text-brand' : 'text-ink-3')} aria-hidden />
            {item.name}
            {item.href === '/calendar' && examIn !== null ? (
              <span className="ml-auto rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">
                {examIn === 0 ? 'Exam today' : `Exam in ${examIn}d`}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Browser-local shortcuts to the last lectures opened — not progress tracking. */
function RecentlyOpened() {
  const items = useRecentlyOpened().slice(0, 4);
  if (items.length === 0) return null;
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between px-3 pb-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Recently opened</p>
        <button type="button" onClick={forgetRecentlyOpened} className="rounded text-[11px] text-ink-3 hover:text-ink-1">
          Clear
        </button>
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.lectureId}>
            <Link
              href={`/subjects/${item.subjectId}/lectures/${item.lectureId}`}
              className="flex gap-2.5 rounded-lg px-3 py-1.5 transition-colors hover:bg-slate-100"
            >
              <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-ink-1">{item.title}</span>
                <span className="block truncate text-[11px] text-ink-3">
                  {item.subjectCode}
                  {item.lectureNumber ? ` · Lecture ${item.lectureNumber}` : ''}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserMenu({
  name,
  detail,
  onLogout,
  isLoggingOut,
}: {
  name: string;
  detail: string;
  onLogout: () => void;
  isLoggingOut: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 border-t border-slate-200/70 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold text-brand-hover">
        {getInitials(name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink-1">{name}</span>
        <span className="block truncate text-xs text-ink-3">{detail}</span>
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-slate-100 hover:text-ink-1"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="min-w-52">
          <DropdownMenuItem asChild>
            <Link href="/about-me">
              <CircleUser className="h-4 w-4" />
              My account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/about-us">
              <Info className="h-4 w-4" />
              About MedPi
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="danger"
            onSelect={(event) => {
              event.preventDefault();
              onLogout();
            }}
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const RAIL_LINK = 'flex h-10 w-10 items-center justify-center rounded-xl transition-colors';

/** Focus rail used on lecture pages: icons only, same destinations. */
function Rail({ pathname, onSearch }: { pathname: string; onSearch: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center gap-1 border-r border-slate-200/70 bg-white py-3 lg:flex">
      <Link href="/" aria-label="MedPi home" className="mb-3">
        <LogoMark className="h-9 w-9" />
      </Link>
      {NAV_ITEMS.slice(0, 3).map((item) => {
        const active = isRouteActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.name}
            title={item.name}
            className={cn(RAIL_LINK, active ? 'bg-brand-subtle text-brand' : 'text-ink-3 hover:bg-slate-100 hover:text-ink-1')}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onSearch}
        aria-label="Search"
        title="Search"
        className={cn(RAIL_LINK, 'text-ink-3 hover:bg-slate-100 hover:text-ink-1')}
      >
        <Search className="h-5 w-5" aria-hidden />
      </button>
      <Link
        href="/learning-hub"
        aria-label="Learning Hub"
        title="Learning Hub"
        className={cn(RAIL_LINK, 'text-ink-3 hover:bg-slate-100 hover:text-ink-1')}
      >
        <BookOpen className="h-5 w-5" aria-hidden />
      </Link>
    </aside>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const profile = useAuthStore((state) => state.profile);
  const { year: studyYear } = useStudyYear();
  const examIn = useExamCountdown();
  const focusMode = /^\/subjects\/[^/]+\/lectures\//.test(pathname);

  const shortcutLabel = useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K'),
    () => 'Ctrl K',
  );
  const today = useSyncExternalStore(
    noopSubscribe,
    () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
    () => '',
  );

  useCommandPaletteShortcut(setSearchOpen);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await api.auth.logout();
      await signOut({ callbackUrl: '/login' });
    } catch {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  const userName = profile?.full_name || session?.user?.name || 'Student';
  const userDetail = [profile?.student_id, profile?.year_level ? `Year ${profile.year_level}` : null].filter(Boolean).join(' · ');

  return (
    <div className="relative min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      {focusMode ? (
        <Rail pathname={pathname} onSearch={() => setSearchOpen(true)} />
      ) : (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/70 bg-white lg:flex">
          <div className="px-4 pb-4 pt-5">
            <Brand />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            <SidebarNav pathname={pathname} examIn={examIn} />
            <RecentlyOpened />
            <div className="mt-4 border-t border-slate-200/70 pt-3">
              <Link
                href="/about-us"
                aria-current={isRouteActive(pathname, '/about-us') ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                  isRouteActive(pathname, '/about-us')
                    ? 'bg-brand-subtle font-semibold text-brand-hover'
                    : 'font-medium text-ink-2 hover:bg-slate-100 hover:text-ink-1',
                )}
              >
                <Users className={cn('h-[18px] w-[18px]', isRouteActive(pathname, '/about-us') ? 'text-brand' : 'text-ink-3')} aria-hidden />
                About us
              </Link>
            </div>
          </div>
          <UserMenu name={userName} detail={userDetail} onLogout={() => void handleLogout()} isLoggingOut={isLoggingOut} />
        </aside>
      )}

      <div className={cn('flex min-h-screen flex-col', focusMode ? 'lg:pl-16' : 'lg:pl-64')}>
        {/* Mobile top bar (lecture pages bring their own back header) */}
        <header className={cn('sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl lg:hidden', focusMode && 'hidden')}>
          <div className="flex h-14 items-center gap-2 px-4">
            <Link href="/" className="flex items-center gap-2" aria-label="MedPi home">
              <LogoMark className="h-8 w-8" />
              <span className="text-base font-semibold tracking-tight text-ink-1">MedPi</span>
            </Link>
            {studyYear ? (
              <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-semibold text-brand-hover">Year {studyYear}</span>
            ) : null}
            <Link
              href="/about-me"
              aria-label="My account"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold text-brand-hover"
            >
              {getInitials(userName)}
            </Link>
          </div>
        </header>

        {/* Desktop top bar */}
        {focusMode ? null : (
          <header className="sticky top-0 z-30 hidden border-b border-slate-200/70 bg-white/85 backdrop-blur-xl lg:block">
            <div className="flex h-16 items-center gap-4 px-8">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm text-ink-3 transition-colors hover:border-slate-300 hover:bg-white"
              >
                <Search className="h-4 w-4" aria-hidden />
                <span className="flex-1 text-left">Search lectures, subjects, lecturers</span>
                <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[11px] font-medium text-ink-3">
                  {shortcutLabel}
                </kbd>
              </button>
              <p className="ml-auto text-sm text-ink-3 tabular">{today}</p>
            </div>
          </header>
        )}

        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'mx-auto w-full flex-1 px-4 pt-6 outline-none sm:px-6 lg:pb-14',
            focusMode ? 'pb-10 pt-0 lg:pt-6' : 'pb-28',
            focusMode ? 'max-w-7xl lg:px-8' : 'max-w-6xl lg:px-8 lg:pt-8',
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation (hidden while watching a lecture) */}
      <nav
        aria-label="Primary"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-slate-200/70 bg-white/95 backdrop-blur-xl lg:hidden',
          focusMode && 'hidden',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {BOTTOM_NAV.map((item) => {
          const active = isRouteActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors',
                active ? 'font-semibold text-brand-hover' : 'text-ink-3',
              )}
            >
              <Icon className={cn('h-5 w-5', active ? 'text-brand' : 'text-ink-3')} aria-hidden />
              <span className="leading-none">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mounted only while open, so every open starts with an empty query. */}
      {searchOpen ? <CommandPalette open onOpenChange={setSearchOpen} /> : null}
    </div>
  );
}
