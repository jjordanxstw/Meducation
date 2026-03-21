'use client';

/**
 * MainLayout - Protected app shell with clean navbar
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Button,
  Tooltip,
} from '@nextui-org/react';
import { useSyncExternalStore, useState, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { FiHome, FiLayers, FiBookOpen, FiUser, FiLogOut, FiMoon, FiSun, FiMail, FiMenu, FiX } from 'react-icons/fi';
import { api } from '@/lib/api';
import { useAppTheme } from '@/app/providers';

const menuItems = [
  { name: 'Home', href: '/', icon: FiHome },
  { name: 'ACDM', href: '/acdm', icon: FiLayers },
  { name: 'Learning Hub', href: '/learning-hub', icon: FiBookOpen },
  { name: 'About Me', href: '/about-me', icon: FiUser },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme, isReady: isThemeReady } = useAppTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const isMenuOpen = menuOpenPath === pathname;

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

  const handleLogoutFromMenu = useCallback(async () => {
    setMenuOpenPath(null);
    await handleLogout();
  }, [handleLogout]);

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
      <div className="glass-orb-a pointer-events-none left-[-5%] top-[-8%]" />
      <div className="glass-orb-b pointer-events-none bottom-[-14%] right-[-2%]" />

      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Skip to main content
      </a>

      <Navbar
        maxWidth="xl"
        height="auto"
        className="card-flat fixed left-0 top-0 z-50 w-screen max-w-none overflow-visible rounded-none border-x-0 border-t-0 px-3 py-2 sm:left-1/2 sm:top-4 sm:w-[calc(100vw-(var(--app-shell-gutter)*2))] sm:max-w-[var(--app-shell-max)] sm:-translate-x-1/2 sm:rounded-[var(--radius-xl)] sm:border sm:px-2"
        classNames={{
          wrapper: 'max-w-full px-0 sm:px-3',
        }}
      >
        <NavbarContent className="min-w-0 gap-1">
          <Button
            isIconOnly
            radius="full"
            variant="light"
            disableRipple
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="icon-circle-btn border-none bg-transparent text-[var(--ink-1)] shadow-none outline-none ring-0 focus-visible:ring-2 focus-visible:ring-blue-500 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent sm:hidden"
            onPress={() => setMenuOpenPath((previousPath) => (previousPath === pathname ? null : pathname))}
          >
            {isMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </Button>
          <NavbarBrand>
            <Link href="/" className="flex items-center gap-2 whitespace-nowrap sm:gap-2.5">
              <div className="card-flat flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-sm font-bold text-primary bg-primary/10">
                L
              </div>
              <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-[var(--ink-1)] sm:text-base lg:text-lg">
                Learning Portal
              </span>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden flex-nowrap gap-1 sm:flex" justify="center">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <NavbarItem key={item.href} isActive={isActive}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-all duration-200 lg:px-4 ${
                    isActive
                      ? 'bg-white/10 font-semibold'
                      : 'text-[var(--ink-2)] hover:bg-default-100/50 hover:text-[var(--ink-1)]'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : ''}`} />
                  <span className={`whitespace-nowrap ${isActive ? 'text-blue-400' : ''}`}>{item.name}</span>
                </Link>
              </NavbarItem>
            );
          })}
        </NavbarContent>

        <NavbarContent justify="end" className="gap-2">
          <Tooltip content="Toggle theme" placement="bottom">
            <Button
              isIconOnly
              radius="full"
              variant="light"
              aria-label="Toggle theme"
              className="icon-circle-btn card-flat text-[var(--ink-1)]"
              onPress={toggleTheme}
            >
              {isThemeReady && theme === 'dark' ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </Button>
          </Tooltip>

          <div className="sm:hidden">
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

          <div className="hidden sm:block">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  isIconOnly
                  radius="full"
                  variant="light"
                  aria-label="User menu"
                  className="icon-circle-btn card-flat text-[var(--ink-1)]"
                >
                  <FiUser className="h-4 w-4" />
                </Button>
              </DropdownTrigger>
              {/* Dropdown with theme-aware background */}
              <DropdownMenu
                aria-label="User menu"
                variant="flat"
                className="min-w-[220px] bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/80 p-2"
                itemClasses={{
                  base: 'rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer',
                }}
              >
                <DropdownSection showDivider>
                  {/* User info header */}
                  <DropdownItem key="profile" isReadOnly className="cursor-default opacity-100 hover:bg-transparent">
                    <p className="font-semibold text-slate-900 dark:text-white">{session?.user?.name || 'Learner'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{session?.user?.email || '-'}</p>
                  </DropdownItem>
                </DropdownSection>
                <DropdownSection>
                  <DropdownItem
                    key="settings"
                    startContent={<span className="icon-with-text"><FiUser className="h-4 w-4 text-slate-600 dark:text-white/70" /></span>}
                    href="/about-me"
                    className="text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white"
                  >
                    About Me
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 data-[disabled=true]:opacity-50"
                    startContent={
                      <span className="icon-with-text">
                        {isLoggingOut ? (
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <FiLogOut className="h-4 w-4 text-red-500" />
                        )}
                      </span>
                    }
                    onPress={handleLogout}
                    isDisabled={isLoggingOut}
                  >
                    {isLoggingOut ? 'Signing out...' : 'Log out'}
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </div>
        </NavbarContent>
      </Navbar>

      {/* Mobile Navigation Drawer - theme-aware background */}
      {isMenuOpen && (
        <>
          {/* Scrim overlay */}
          <div
            className="fixed inset-0 z-[44] bg-black/40 backdrop-blur-sm dark:bg-black/60 sm:hidden"
            onClick={() => setMenuOpenPath(null)}
          />
          {/* Drawer with theme-aware background */}
          <div className="fixed left-0 top-0 z-[45] h-full max-w-[85vw] w-[280px] bg-white dark:bg-[#0a1628] border-r border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-300/50 dark:shadow-black/80 transform transition-transform duration-300 ease-out sm:hidden">
            <div className="flex h-full flex-col pt-16 pb-4 px-3 overflow-y-auto">
              {/* User info section */}
              <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 p-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{session?.user?.name || 'Learner'}</p>
                    <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <FiMail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{session?.user?.email || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation items */}
              <div className="space-y-1 flex-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpenPath(null)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="whitespace-nowrap">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Log out button */}
              <button
                type="button"
                onClick={() => void handleLogoutFromMenu()}
                disabled={isLoggingOut}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-red-200 dark:border-red-500/30 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <span className="icon-with-text">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </span>
                ) : (
                  <span className="icon-with-text"><FiLogOut className="h-5 w-5" /></span>
                )}
                <span className="font-semibold">{isLoggingOut ? 'Signing out...' : 'Log out'}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main content with page fade-in animation */}
      <main id="main-content" className="relative z-10 flex-1 pt-24 pb-8 sm:pt-28 sm:pb-10 animate-page-in" tabIndex={-1}>
        <div className="mx-auto w-full max-w-[var(--app-shell-max)] px-[var(--app-shell-gutter)]">
          {children}
        </div>
      </main>

      {/* Footer - reduced visual weight */}
      <footer className="relative z-10 mx-auto mb-6 mt-2 w-[calc(100vw-(var(--app-shell-gutter)*2))] max-w-[var(--app-shell-max)] rounded-[var(--radius-xl)] py-3 card-flat border-slate-200/50 dark:border-white/5">
        <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-white/30">
            © 2026 Learning Portal.
          </p>
        </div>
      </footer>
    </div>
  );
}
