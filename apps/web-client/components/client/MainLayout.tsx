'use client';

/**
 * MainLayout — protected app shell.
 * Editorial-premium sidebar workspace. English-only, single light theme.
 * Desktop: fixed left sidebar + slim top bar. Mobile: top bar + slide-over
 * drawer + bottom nav. HeroUI + Tailwind only.
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Input,
  Drawer,
  DrawerContent,
  DrawerBody,
  useDisclosure,
} from '@heroui/react';
import { useState, useCallback, type FormEvent } from 'react';
import { signOut, useSession } from 'next-auth/react';
import {
  FiHome,
  FiLayers,
  FiBookOpen,
  FiUser,
  FiUsers,
  FiLogOut,
  FiCalendar,
  FiSearch,
  FiMenu,
  FiSettings,
} from 'react-icons/fi';
import { api } from '@/lib/api';

const NAV_ITEMS = [
  { name: 'Home', href: '/', icon: FiHome },
  { name: 'Subjects', href: '/subjects', icon: FiLayers },
  { name: 'Learning Hub', href: '/learning-hub', icon: FiBookOpen },
  { name: 'Calendar', href: '/#calendar', icon: FiCalendar },
  { name: 'About Us', href: '/about-us', icon: FiUsers },
];

// Bottom navigation (mobile/tablet) — quick access to primary destinations.
const BOTTOM_NAV = [
  { name: 'Home', href: '/', icon: FiHome },
  { name: 'Subjects', href: '/subjects', icon: FiLayers },
  { name: 'Calendar', href: '/#calendar', icon: FiCalendar },
  { name: 'Profile', href: '/about-me', icon: FiUser },
];

function isRouteActive(pathname: string, href: string): boolean {
  if (href.includes('#')) return false; // anchor jump, not a page
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string | undefined | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Brand wordmark — flat brand mark, serif lockup, single accent (no gradient).
function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="MedPi Portal home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-subtle ring-1 ring-brand/20">
        <span className="font-serif text-lg font-semibold leading-none">M</span>
      </span>
      {!compact && (
        <span className="font-serif text-lg font-semibold tracking-tight text-slate-900">
          MedPi <span className="text-brand">Portal</span>
        </span>
      )}
    </Link>
  );
}

// Shared sidebar nav (desktop rail + mobile drawer).
function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = isRouteActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              active
                ? 'bg-brand-subtle font-semibold text-brand'
                : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <item.icon className={`h-[18px] w-[18px] ${active ? 'text-brand' : 'text-slate-400'}`} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

// Bottom user block in the sidebar/drawer: profile link + logout.
function UserBlock({
  name,
  email,
  image,
  onNavigate,
  onLogout,
}: {
  name: string;
  email: string;
  image?: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="border-t border-slate-200/70 p-3">
      <div className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-slate-50">
        <Link
          href="/about-me"
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Avatar
            size="sm"
            name={getInitials(name)}
            src={image}
            classNames={{ base: 'bg-brand shrink-0', name: 'text-white font-semibold text-xs' }}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-900">{name}</span>
            <span className="block truncate text-xs text-slate-400">{email}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <FiLogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [query, setQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

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

  const handleSearch = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const q = query.trim();
      router.push(q ? `/subjects?q=${encodeURIComponent(q)}` : '/subjects');
    },
    [query, router],
  );

  const userName = session?.user?.name || 'Learner';
  const userEmail = session?.user?.email || '';
  const userImage = session?.user?.image ?? undefined;

  return (
    <div className="relative min-h-screen">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center px-5">
          <BrandMark />
        </div>
        <SidebarNav pathname={pathname} />
        <UserBlock name={userName} email={userEmail} image={userImage} onLogout={() => void handleLogout()} />
      </aside>

      {/* Content column */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
            {/* Mobile: menu + brand */}
            <button
              type="button"
              onClick={onOpen}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <BrandMark compact />
            </div>

            {/* Search (sm+) */}
            <form onSubmit={handleSearch} className="ml-1 hidden flex-1 sm:block sm:max-w-sm">
              <Input
                aria-label="Search subjects"
                value={query}
                onValueChange={setQuery}
                placeholder="Search subjects…"
                radius="full"
                size="sm"
                startContent={<FiSearch className="h-4 w-4 text-slate-400" />}
                classNames={{
                  inputWrapper:
                    'h-10 bg-slate-100/70 border border-transparent shadow-none data-[hover=true]:bg-slate-100 group-data-[focus=true]:border-brand/50 group-data-[focus=true]:bg-white',
                  input: 'text-sm',
                }}
              />
            </form>

            <div className="flex-1 sm:hidden" />

            {/* Right: mobile search shortcut + avatar menu */}
            <Link
              href="/subjects"
              aria-label="Search subjects"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:hidden"
            >
              <FiSearch className="h-5 w-5" />
            </Link>

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button
                  type="button"
                  aria-label="Open user menu"
                  className="rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <Avatar
                    size="sm"
                    name={getInitials(userName)}
                    src={userImage}
                    classNames={{ base: 'bg-brand', name: 'text-white font-semibold text-xs' }}
                  />
                </button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User actions" variant="flat">
                <DropdownItem key="profile-info" isReadOnly className="h-14 gap-2 opacity-100" textValue="Signed in">
                  <p className="font-semibold text-slate-900">{userName}</p>
                  <p className="truncate text-xs text-slate-500">{userEmail || '-'}</p>
                </DropdownItem>
                <DropdownItem key="about-me" href="/about-me" startContent={<FiUser className="h-4 w-4" />}>
                  About Me
                </DropdownItem>
                <DropdownItem key="profile" href="/profile" startContent={<FiSettings className="h-4 w-4" />}>
                  Edit Profile
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  className="text-danger"
                  startContent={<FiLogOut className="h-4 w-4" />}
                  onPress={() => void handleLogout()}
                >
                  {isLoggingOut ? 'Signing out…' : 'Log out'}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </header>

        {/* Main content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 sm:px-6 lg:pb-14"
        >
          {children}
        </main>

        {/* Footer */}
        <footer className="mx-auto mb-24 w-full max-w-6xl px-4 sm:px-6 lg:mb-6">
          <p className="border-t border-slate-200/70 py-5 text-center text-xs text-slate-400">
            © 2026 MedPi Portal · Built for medical students
          </p>
        </footer>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-slate-200/70 bg-white/90 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {BOTTOM_NAV.map((item) => {
          const active = isRouteActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                active ? 'text-brand' : 'text-slate-400'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className={active ? 'font-semibold leading-none' : 'leading-none'}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile slide-over drawer */}
      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="left"
        size="xs"
        hideCloseButton
        classNames={{ base: 'bg-white' }}
      >
        <DrawerContent>
          <DrawerBody className="flex flex-col gap-0 p-0">
            <div className="flex h-16 items-center px-5">
              <BrandMark />
            </div>
            <SidebarNav pathname={pathname} onNavigate={onClose} />
            <UserBlock
              name={userName}
              email={userEmail}
              image={userImage}
              onNavigate={onClose}
              onLogout={() => void handleLogout()}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
