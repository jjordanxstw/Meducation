'use client';

/**
 * MainLayout - Protected app shell with liquid glass navbar
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { FiHome, FiLayers, FiBookOpen, FiUser, FiLogOut } from 'react-icons/fi';
import { api } from '@/lib/api';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    await signOut({ callbackUrl: '/login' });
  };

  if (!mounted) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-glass-canvas">
        <main className="relative z-10 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-glass-canvas">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.18),transparent_36%),radial-gradient(circle_at_85%_20%,rgba(14,165,233,0.22),transparent_42%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.14),transparent_38%)]" />
      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        maxWidth="xl"
        height="auto"
        className="glass-nav border-b border-white/25"
      >
        <NavbarContent>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="sm:hidden"
          />
          <NavbarBrand>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/65 text-sm font-bold text-sky-700 shadow-sm backdrop-blur">
                {/* TODO: Replace with brand logo image provided by user */}
                L
              </div>
              <span className="hidden text-lg font-semibold tracking-tight text-slate-800 sm:inline">
                Learning Portal
              </span>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-1" justify="center">
          {menuItems.map((item) => (
            <NavbarItem key={item.href} isActive={pathname === item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                  pathname === item.href
                    ? 'bg-white/70 font-semibold text-slate-900 shadow-sm'
                    : 'text-slate-700 hover:bg-white/40 hover:text-slate-900'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent justify="end">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                color="primary"
                name={session?.user?.name || 'User'}
                src={session?.user?.image ?? undefined}
                size="sm"
                className="cursor-pointer"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="gap-2">
                <p className="font-semibold">{session?.user?.name || 'Learner'}</p>
                <p className="text-sm text-default-500">{session?.user?.email || '-'}</p>
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<FiUser className="h-4 w-4" />}
                href="/about-me"
              >
                About Me
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<FiLogOut className="h-4 w-4" />}
                onPress={handleLogout}
              >
                Log out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>

        <NavbarMenu>
          {menuItems.map((item) => (
            <NavbarMenuItem key={item.href}>
              <Link
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 ${
                  pathname === item.href
                    ? 'font-semibold text-slate-900'
                    : 'text-slate-700 hover:bg-white/40'
                }`}
              >
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </Navbar>

      <main className="relative z-10 flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <footer className="relative z-10 border-t border-white/25 py-6">
        <div className="text-center">
          <p className="text-xs text-slate-600">
            © 2026 Learning Portal. Liquid glass shell prototype.
          </p>
        </div>
      </footer>
    </div>
  );
}
