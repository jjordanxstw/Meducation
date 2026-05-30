'use client';

/**
 * MainLayout - Protected app shell with clean navbar.
 * English-only, single light theme.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
} from '@heroui/react';
import { useSyncExternalStore, useState, useCallback, useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { FiHome, FiLayers, FiBookOpen, FiUser, FiUsers, FiLogOut, FiMenu, FiX, FiCalendar } from 'react-icons/fi';
import { api } from '@/lib/api';

const menuItems = [
  { name: 'Home', href: '/', icon: FiHome },
  { name: 'ACDM', href: '/subjects', icon: FiLayers },
  { name: 'Learning Hub', href: '/learning-hub', icon: FiBookOpen },
  { name: 'About Us', href: '/about-us', icon: FiUsers },
];

// Bottom navigation (mobile) — quick access to the primary destinations.
const bottomNavItems = [
  { name: 'Home', href: '/', icon: FiHome },
  { name: 'ACDM', href: '/subjects', icon: FiLayers },
  { name: 'Calendar', href: '/calendar', icon: FiCalendar },
  { name: 'About Me', href: '/about-me', icon: FiUser },
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
  const { data: session } = useSession();
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
      await signOut({ callbackUrl: '/login' });
    } catch {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  const handleLogoutFromDrawer = useCallback(async () => {
    setIsDrawerOpen(false);
    await handleLogout();
  }, [handleLogout]);

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
        Skip to main content
      </a>

      {/* DESKTOP NAVBAR */}
      <Navbar
        maxWidth="xl"
        height="auto"
        className="fixed left-0 top-0 z-50 w-screen max-w-none overflow-visible rounded-none border-x-0 border-t-0 border-b border-slate-200/90 bg-[var(--bg-surface)]/95 backdrop-blur-md px-3 py-2 sm:left-1/2 sm:top-4 sm:w-[calc(100vw-(var(--app-shell-gutter)*2))] sm:max-w-[var(--app-shell-max)] sm:-translate-x-1/2 sm:rounded-[var(--radius-xl)] sm:border sm:px-2 sm:shadow-[var(--shadow-sm)]"
        classNames={{
          wrapper: 'max-w-full px-0 sm:px-3',
        }}
      >
        <NavbarContent className="min-w-0 gap-1">
          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
            aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
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
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-500' : ''}`} />
                  <span className="whitespace-nowrap">{item.name}</span>
                  {isActive && (
                    <span className="pointer-events-none absolute inset-x-2 -bottom-0.5 h-0.5 origin-left animate-underline-in rounded-full bg-gradient-to-r from-blue-400 to-blue-500" />
                  )}
                </Link>
              </NavbarItem>
            );
          })}
        </NavbarContent>

        <NavbarContent justify="end" className="gap-2">
          {/* Mobile profile link */}
          <div className="md:hidden">
            <Link href="/about-me" aria-label="Open profile">
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

          {/* Desktop user dropdown */}
          <div className="hidden md:block relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white hover:bg-blue-500 transition"
              aria-label="User menu"
            >
              {getInitials(session?.user?.name)}
            </button>

            {/* Dropdown popover */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-[220px] bg-[var(--bg-surface-elevated)] border border-slate-200 rounded-2xl shadow-[var(--shadow-lg)] z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User info section */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-semibold text-sm text-slate-900 truncate">{session?.user?.name || 'Learner'}</p>
                  <p className="text-xs text-slate-400 truncate">{session?.user?.email || '-'}</p>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <Link
                    href="/about-me"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
                  >
                    <FiUser size={15} />
                    About Me
                  </Link>

                  <div className="h-px bg-slate-100 mx-1.5 my-1" />

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      void handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <FiLogOut size={15} />
                    )}
                    {isLoggingOut ? 'Signing out...' : 'Log out'}
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
        className={`fixed top-0 left-0 h-full w-[280px] z-50 bg-[var(--bg-surface)] border-r border-slate-200 shadow-2xl shadow-slate-300/40 transform [will-change:transform] transition-transform duration-[250ms] ease-out md:hidden ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-2" onClick={() => setIsDrawerOpen(false)}>
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                M
              </div>
              <span className="font-semibold text-slate-900">MedPi Portal</span>
            </Link>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition"
              aria-label="Close menu"
            >
              <FiX className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* User info card */}
          <div className="mx-3 mt-4 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                {getInitials(session?.user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-900 truncate">{session?.user?.name || 'Learner'}</p>
                <p className="text-xs text-slate-400 truncate">{session?.user?.email || '-'}</p>
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
                  className={`flex min-h-[52px] items-center gap-3 rounded-xl px-4 py-3 transition cursor-pointer active:bg-slate-200 ${
                    isActive
                      ? 'border-l-2 border-blue-500 bg-blue-500/10 text-blue-600 font-medium'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Bottom section */}
          <div className="p-2 border-t border-slate-100">
            {/* Log out button */}
            <button
              type="button"
              onClick={() => void handleLogoutFromDrawer()}
              disabled={isLoggingOut}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <FiLogOut size={16} />
              )}
              <span>{isLoggingOut ? 'Signing out...' : 'Log out'}</span>
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
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-slate-200 bg-[var(--bg-surface)]/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary"
      >
        {bottomNavItems.map((item) => {
          const isActive = isRouteActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                isActive ? 'text-blue-500' : 'text-slate-400'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5" />
              {isActive && <span className="font-medium leading-none">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer - reduced visual weight */}
      <footer className="relative z-10 mx-auto mb-24 mt-2 w-[calc(100vw-(var(--app-shell-gutter)*2))] max-w-[var(--app-shell-max)] rounded-[var(--radius-xl)] py-3 card-flat border-slate-200/50 md:mb-6">
        <div className="text-center">
          <p className="text-xs text-slate-400">© 2026 MedPi Portal.</p>
        </div>
      </footer>
    </div>
  );
}
