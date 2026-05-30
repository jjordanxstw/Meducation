'use client';

/**
 * MainLayout - Protected app shell with clean navbar
 * Redesigned with improved mobile drawer and user dropdown
 * Uses next-intl for locale-aware routing
 */

import { usePathname, useRouter, Link } from '@/i18n/routing';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Tooltip,
} from '@nextui-org/react';
import { useSyncExternalStore, useState, useCallback, useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { FiHome, FiLayers, FiBookOpen, FiUser, FiUsers, FiLogOut, FiMoon, FiSun, FiMenu, FiX, FiCalendar } from 'react-icons/fi';
import { api } from '@/lib/api';
import { useAppTheme } from '@/app/providers';
import { useLocale, useTranslations } from 'next-intl';

const menuItems = [
  { nameKey: 'home', href: '/', icon: FiHome },
  { nameKey: 'acdm', href: '/subjects', icon: FiLayers },
  { nameKey: 'learningHub', href: '/learning-hub', icon: FiBookOpen },
  { nameKey: 'aboutUs', href: '/about-us', icon: FiUsers },
];

// Bottom navigation (mobile) — quick access to the primary destinations.
const bottomNavItems = [
  { nameKey: 'home', href: '/', icon: FiHome },
  { nameKey: 'acdm', href: '/subjects', icon: FiLayers },
  { nameKey: 'calendar', href: '/calendar', icon: FiCalendar },
  { nameKey: 'aboutMe', href: '/about-me', icon: FiUser },
];

// Active when the path matches exactly, or is a child route (e.g. /subjects/123).
// The home route ('/') only matches exactly.
function isRouteActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, toggleTheme, isReady: isThemeReady } = useAppTheme();
  const locale = useLocale();
  const t = useTranslations();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await api.auth.logout();
      // Preserve the user's chosen language across sign-out so the login
      // screen they land on speaks their language.
      await signOut({ callbackUrl: `/${locale}/login` });
    } catch {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, locale]);

  const handleLogoutFromDrawer = useCallback(async () => {
    setIsDrawerOpen(false);
    await handleLogout();
  }, [handleLogout]);

  // Switch locale while staying on the same page
  const handleLocaleChange = useCallback((newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  }, [router, pathname]);

  // Get initials from name
  const getInitials = (name: string | undefined | null): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (!mounted) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-glass-canvas">
        <main className="relative z-10 flex-1 pt-24 pb-8 sm:pt-28 sm:pb-10">
          <div className="mx-auto w-full max-w-[var(--app-shell-max)] px-[var(--app-shell-gutter)]">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-glass-canvas">
      <div className="glass-orb-a pointer-events-none left-[-5%] top-[-8%] opacity-75" />
      <div className="glass-orb-b pointer-events-none bottom-[-14%] right-[-2%] opacity-70" />

      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        {t('nav.skipToContent')}
      </a>

      {/* DESKTOP NAVBAR */}
      <Navbar
        maxWidth="xl"
        height="auto"
        className="fixed left-0 top-0 z-50 w-screen max-w-none overflow-visible rounded-none border-x-0 border-t-0 border-b border-slate-200/90 dark:border-white/10 bg-[var(--bg-surface)]/95 backdrop-blur-md px-3 py-2 sm:left-1/2 sm:top-4 sm:w-[calc(100vw-(var(--app-shell-gutter)*2))] sm:max-w-[var(--app-shell-max)] sm:-translate-x-1/2 sm:rounded-[var(--radius-xl)] sm:border sm:px-2 sm:shadow-[var(--shadow-sm)]"
        classNames={{
          wrapper: 'max-w-full px-0 sm:px-3',
        }}
      >
        <NavbarContent className="min-w-0 gap-1">
          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/15 transition"
            aria-label={isDrawerOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          >
            {isDrawerOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>

          <NavbarBrand>
            <Link href="/" className="flex items-center gap-2 whitespace-nowrap sm:gap-2.5">
              <div className="card-flat flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-sm font-bold text-primary bg-primary/10">
                M
              </div>
              <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-[var(--ink-1)] sm:text-base lg:text-lg">
                MedPi Portal
              </span>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        {/* Desktop navigation */}
        <NavbarContent className="hidden flex-nowrap gap-1 md:flex" justify="center">
          {menuItems.map((item) => {
            const isActive = isRouteActive(pathname, item.href);
            return (
              <NavbarItem key={item.href} isActive={isActive}>
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm transition-colors duration-200 lg:px-4 ${
                    isActive
                      ? 'font-medium text-[var(--ink-1)]'
                      : 'text-[var(--ink-2)] hover:text-[var(--ink-1)]'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-500 dark:text-blue-400' : ''}`} />
                  <span className="whitespace-nowrap">{t(`nav.${item.nameKey}`)}</span>
                  {isActive && (
                    <span className="pointer-events-none absolute inset-x-2 -bottom-0.5 h-0.5 origin-left animate-underline-in rounded-full bg-gradient-to-r from-blue-400 to-blue-500" />
                  )}
                </Link>
              </NavbarItem>
            );
          })}
        </NavbarContent>

        <NavbarContent justify="end" className="gap-2">
          {/* Language Switcher */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-white/10 rounded-xl p-1">
            {(['en', 'th'] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  locale === loc
                    ? 'bg-white dark:bg-[#0d1b2e] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-white/40 hover:text-slate-700'
                }`}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <Tooltip content={t('nav.toggleTheme')} placement="bottom">
            <Button
              isIconOnly
              radius="full"
              variant="light"
              aria-label={t('nav.toggleTheme')}
              className="icon-circle-btn card-flat text-[var(--ink-1)]"
              onPress={toggleTheme}
            >
              {isThemeReady && theme === 'dark' ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </Button>
          </Tooltip>

          {/* Mobile profile link */}
          <div className="md:hidden">
            <Link href="/about-me" aria-label={t('nav.openProfile')}>
              <Button
                isIconOnly
                radius="full"
                variant="light"
                className="icon-circle-btn card-flat text-[var(--ink-1)]"
              >
                <FiUser className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Desktop user dropdown - Simplified */}
          <div className="hidden md:block relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white hover:bg-blue-500 transition"
              aria-label={t('nav.userMenu')}
            >
              {getInitials(session?.user?.name)}
            </button>

            {/* Dropdown popover */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-[220px] bg-[var(--bg-surface-elevated)] border border-slate-200 dark:border-white/10 rounded-2xl shadow-[var(--shadow-lg)] z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User info section */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.08]">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{session?.user?.name || 'Learner'}</p>
                  <p className="text-xs text-slate-400 dark:text-white/40 truncate">{session?.user?.email || '-'}</p>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <Link
                    href="/about-me"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                  >
                    <FiUser size={15} />
                    {t('nav.aboutMe')}
                  </Link>

                  <div className="h-px bg-slate-100 dark:bg-white/[0.08] mx-1.5 my-1" />

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      void handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <FiLogOut size={15} />
                    )}
                    {isLoggingOut ? t('nav.loggingOut') : t('nav.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </NavbarContent>
      </Navbar>

      {/* MOBILE DRAWER OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-200 ${
          isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* MOBILE DRAWER PANEL */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] z-50 bg-[var(--bg-surface)] border-r border-slate-200 dark:border-white/10 shadow-2xl shadow-black/30 transform [will-change:transform] transition-transform duration-[250ms] ease-out md:hidden ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-white/10">
            <Link href="/" className="flex items-center gap-2" onClick={() => setIsDrawerOpen(false)}>
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                M
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">MedPi Portal</span>
            </Link>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition"
              aria-label={t('nav.closeMenu')}
            >
              <FiX className="h-5 w-5 text-slate-600 dark:text-white/70" />
            </button>
          </div>

          {/* User info card */}
          <div className="mx-3 mt-4 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                {getInitials(session?.user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{session?.user?.name || 'Learner'}</p>
                <p className="text-xs text-slate-400 dark:text-white/40 truncate">{session?.user?.email || '-'}</p>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="flex-1 px-2 space-y-1">
            {menuItems.map((item) => {
              const isActive = isRouteActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsDrawerOpen(false)}
                  className={`flex min-h-[52px] items-center gap-3 rounded-xl px-4 py-3 transition cursor-pointer active:bg-slate-200 dark:active:bg-white/[0.1] ${
                    isActive
                      ? 'border-l-2 border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{t(`nav.${item.nameKey}`)}</span>
                </Link>
              );
            })}
          </div>

          {/* Bottom section */}
          <div className="p-2 border-t border-slate-100 dark:border-white/10">
            {/* Language switcher row */}
            <div className="flex items-center justify-between w-full px-4 py-3">
              <span className="text-sm text-slate-700 dark:text-white/70">{t('nav.language')}</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 rounded-xl p-1">
                {(['en', 'th'] as const).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLocaleChange(loc)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      locale === loc
                        ? 'bg-white dark:bg-[#0d1b2e] text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-white/40 hover:text-slate-700'
                    }`}
                  >
                    {loc.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme toggle row */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3 text-slate-700 dark:text-white/70">
                {isThemeReady && theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
                <span>{t('nav.darkMode')}</span>
              </div>
              {/* Toggle switch */}
              <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${isThemeReady && theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isThemeReady && theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>

            {/* Divider */}
            <div className="h-px bg-slate-100 dark:bg-white/10 my-2" />

            {/* Log out button */}
            <button
              type="button"
              onClick={() => void handleLogoutFromDrawer()}
              disabled={isLoggingOut}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <FiLogOut size={16} />
              )}
              <span>{isLoggingOut ? t('nav.loggingOut') : t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content with page fade-in animation */}
      <main id="main-content" className="relative z-10 flex-1 pt-24 pb-8 sm:pt-28 sm:pb-10 animate-page-in" tabIndex={-1}>
        <div className="mx-auto w-full max-w-[var(--app-shell-max)] px-[var(--app-shell-gutter)]">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-slate-200 bg-[var(--bg-surface)]/95 backdrop-blur-xl dark:border-white/10 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label={t('nav.openMenu')}
      >
        {bottomNavItems.map((item) => {
          const isActive = isRouteActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-white/40'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5" />
              {isActive && <span className="font-medium leading-none">{t(`nav.${item.nameKey}`)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer - reduced visual weight */}
      <footer className="relative z-10 mx-auto mb-24 mt-2 w-[calc(100vw-(var(--app-shell-gutter)*2))] max-w-[var(--app-shell-max)] rounded-[var(--radius-xl)] py-3 card-flat border-slate-200/50 dark:border-white/5 md:mb-6">
        <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-white/30">
            {t('footer')}
          </p>
        </div>
      </footer>
    </div>
  );
}
