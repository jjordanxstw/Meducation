'use client';

/**
 * MainLayout - Main application layout with Navbar
 * Next.js adapted version
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
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { FiHome, FiBook, FiCalendar, FiUser, FiLogOut } from 'react-icons/fi';

const menuItems = [
  { name: 'Home', href: '/', icon: FiHome },
  { name: 'Subjects', href: '/subjects', icon: FiBook },
  { name: 'Calendar', href: '/calendar', icon: FiCalendar },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, profile, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint to revoke refresh token
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local auth state
      clearAuth();
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        maxWidth="xl"
        height="auto"
        className="bg-background/70 backdrop-blur-md border-b border-divider"
      >
        <NavbarContent>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="sm:hidden"
          />
          <NavbarBrand>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 font-bold text-white shadow-md">
                M
              </div>
              <span className="font-bold text-xl hidden sm:inline">
                Medical Portal
              </span>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-1" justify="center">
          {menuItems.map((item) => (
            <NavbarItem key={item.href} isActive={pathname === item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'text-primary font-semibold'
                    : 'text-default-600 hover:text-primary hover:bg-default-100'
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
                name={profile?.full_name || user?.name}
                src={user?.picture}
                size="sm"
                className="cursor-pointer"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="gap-2">
                <p className="font-semibold">{profile?.full_name || user?.name}</p>
                <p className="text-sm text-default-500">{user?.email}</p>
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<FiUser className="h-4 w-4" />}
                href="/profile"
              >
                Profile
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<FiLogOut className="h-4 w-4" />}
                onPress={handleLogout}
              >
                Sign Out
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
                    ? 'text-primary font-semibold'
                    : 'text-default-600 hover:bg-default-100'
                }`}
              >
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </Navbar>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <footer className="border-t border-divider py-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary-500 to-primary-600 font-bold text-white text-xs">
              M
            </div>
            <span className="font-semibold text-sm">Medical Learning Portal</span>
          </div>
          <p className="text-xs text-default-400">
            © 2026 Medical Learning Portal. All rights reserved.
          </p>
          <p className="text-xs text-default-300 mt-1">
            Faculty of Medicine, Mahidol University
          </p>
        </div>
      </footer>
    </div>
  );
}
