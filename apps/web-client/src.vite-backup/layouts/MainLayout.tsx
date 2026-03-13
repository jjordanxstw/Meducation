/**
 * MainLayout - Main application layout with Navbar
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { useState } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { FiHome, FiBook, FiCalendar, FiUser, FiLogOut } from 'react-icons/fi';

const menuItems = [
  { name: 'Home', href: '/', icon: FiHome },
  { name: 'Subjects', href: '/subjects', icon: FiBook },
  { name: 'Calendar', href: '/calendar', icon: FiCalendar },
];

export default function MainLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-medical-gray-50 flex flex-col">
      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        className="bg-white/95 backdrop-blur-md shadow-sm border-b border-medical-gray-200/50 py-2 sm:py-3 navbar-sticky"
        maxWidth="xl"
        height="auto"
      >
        <NavbarContent className="basis-1/5 sm:basis-full">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            className="sm:hidden"
          />
          <NavbarBrand>
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg gradient-medical flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-base sm:text-lg">M</span>
              </div>
              <span className="font-heading font-bold text-base sm:text-xl text-medical-gray-900 hidden xs:inline">
                Medical Portal
              </span>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-3 md:gap-6" justify="center">
          {menuItems.map((item) => (
            <NavbarItem key={item.href} isActive={location.pathname === item.href}>
              <Link
                to={item.href}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 ${
                  location.pathname === item.href
                    ? 'text-primary-600 font-semibold bg-primary-50 shadow-sm'
                    : 'text-medical-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium text-sm sm:text-base">{item.name}</span>
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent className="basis-1/5 sm:basis-full" justify="end">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform border-2 border-primary-500 shadow-md hover:shadow-lg"
                color="primary"
                name={profile?.full_name || user?.name}
                size="sm"
                src={user?.picture}
                classNames={{
                  base: "ring-2 ring-primary-100",
                  img: "object-cover"
                }}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">{profile?.full_name || user?.name}</p>
                <p className="text-sm text-medical-gray-500">{user?.email}</p>
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<FiUser className="w-4 h-4" />}
                href="/profile"
              >
                Profile
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<FiLogOut className="w-4 h-4" />}
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
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  location.pathname === item.href
                    ? 'text-primary-600 bg-primary-50 font-semibold shadow-sm'
                    : 'text-medical-gray-600 hover:bg-medical-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </Navbar>

      <main className="container-xl max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 flex-1 w-full">
        <Outlet />
      </main>

      <footer className="bg-white/80 backdrop-blur-sm border-t border-medical-gray-200/50 py-6 sm:py-8 mt-auto">
        <div className="container-xl max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg gradient-medical flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs sm:text-sm">M</span>
            </div>
            <span className="font-heading font-semibold text-medical-gray-900 text-sm sm:text-base">Medical Learning Portal</span>
          </div>
          <p className="text-medical-gray-500 text-xs sm:text-sm">© 2026 Medical Learning Portal. All rights reserved.</p>
          <p className="text-medical-gray-400 text-xs mt-1 leading-relaxed">Faculty of Medicine, Mahidol University</p>
        </div>
      </footer>
    </div>
  );
}
