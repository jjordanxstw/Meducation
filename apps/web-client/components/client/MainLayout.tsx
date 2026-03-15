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
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@nextui-org/react';
import { useEffect, useState } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme, isReady: isThemeReady } = useAppTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await api.auth.logout();
    await signOut({ callbackUrl: '/login' });
  };

  const handleLogoutFromMenu = async () => {
    setIsMenuOpen(false);
    await handleLogout();
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
      <div className="glass-orb-a pointer-events-none left-[-5%] top-[-8%]" />
      <div className="glass-orb-b pointer-events-none bottom-[-14%] right-[-2%]" />

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
            className="icon-circle-btn border-none bg-transparent text-[var(--ink-1)] shadow-none outline-none ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 sm:hidden"
            onPress={() => setIsMenuOpen((prev) => !prev)}
          >
            {isMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </Button>
          <NavbarBrand>
            <Link href="/" className="flex items-center gap-2 whitespace-nowrap sm:gap-2.5">
              <div className="card-flat flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-sm font-bold text-primary bg-primary/10">
                {/* TODO: Replace with brand logo image provided by user */}
                L
              </div>
              <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-[var(--ink-1)] sm:text-base lg:text-lg">
                Learning Portal
              </span>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden flex-nowrap gap-1 sm:flex" justify="center">
          {menuItems.map((item) => (
            <NavbarItem key={item.href} isActive={pathname === item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] px-3 py-2 text-sm transition-all duration-200 lg:px-4 ${
                  pathname === item.href
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-[var(--ink-2)] hover:bg-default-100/50'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{item.name}</span>
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent justify="end" className="gap-2">
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
                  aria-label="Open profile menu"
                  className="icon-circle-btn card-flat text-[var(--ink-1)]"
                >
                  <FiUser className="h-4 w-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="gap-2">
                  <p className="font-semibold">{session?.user?.name || 'Learner'}</p>
                  <p className="text-sm text-default-500">{session?.user?.email || '-'}</p>
                </DropdownItem>
                <DropdownItem
                  key="settings"
                  startContent={<span className="icon-with-text"><FiUser className="h-4 w-4" /></span>}
                  href="/about-me"
                >
                  About Me
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  startContent={<span className="icon-with-text"><FiLogOut className="h-4 w-4" /></span>}
                  onPress={handleLogout}
                >
                  Log out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </NavbarContent>
      </Navbar>

      {isMenuOpen && (
        <div className="fixed inset-x-0 top-[3.85rem] z-[45] max-h-[calc(100dvh-3.85rem)] overflow-y-auto border-b bg-[var(--surface-1)] px-3 py-3 shadow-lg sm:hidden">
          <div className="card-flat mb-3 flex items-center gap-3 rounded-[var(--radius-md)] p-3">
            <Avatar
              color="primary"
              name={session?.user?.name || 'User'}
              src={session?.user?.image ?? undefined}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--ink-1)]">{session?.user?.name || 'Learner'}</p>
              <div className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--ink-2)]">
                <FiMail className="h-3 w-3 shrink-0" />
                <span className="truncate">{session?.user?.email || '-'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 ${
                  pathname === item.href
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-[var(--ink-2)] hover:bg-default-100/50'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{item.name}</span>
              </Link>
            ))}

            <button
              type="button"
              onClick={() => void handleLogoutFromMenu()}
              className="mt-2 flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-danger/25 bg-danger/10 px-4 py-3 text-danger"
            >
              <span className="icon-with-text"><FiLogOut className="h-4 w-4" /></span>
              <span className="font-semibold">Log out</span>
            </button>
          </div>
        </div>
      )}

      <main className="relative z-10 flex-1 pt-24 pb-8 sm:pt-28 sm:pb-10">
        <div className="mx-auto w-full max-w-[var(--app-shell-max)] px-[var(--app-shell-gutter)]">
          {children}
        </div>
      </main>

      <footer className="relative z-10 mx-auto mb-6 mt-2 w-[calc(100vw-(var(--app-shell-gutter)*2))] max-w-[var(--app-shell-max)] rounded-[var(--radius-xl)] py-4 card-flat">
        <div className="text-center">
          <p className="text-xs text-[var(--ink-2)]">
            © 2026 Learning Portal.
          </p>
        </div>
      </footer>
    </div>
  );
}
