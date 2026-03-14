/**
 * MainLayout - Main application layout with Sidebar
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { Avatar } from '@heroui/react';
import { useState } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { FiHome, FiBook, FiCalendar, FiUser, FiLogOut, FiChevronLeft, FiChevronRight, FiMenu, FiX } from 'react-icons/fi';

const menuItems = [
  { name: 'Home', href: '/', icon: FiHome },
  { name: 'Subjects', href: '/subjects', icon: FiBook },
  { name: 'Calendar', href: '/calendar', icon: FiCalendar },
  { name: 'Profile', href: '/profile', icon: FiUser },
];

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user, profile, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <div className="h-screen bg-medical-gray-50 flex overflow-hidden">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full flex flex-col bg-white border-r border-medical-gray-200 shadow-sm transition-all duration-300 z-40
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 py-5 border-b border-medical-gray-200 flex-shrink-0 ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}>
          <div className="w-8 h-8 rounded-lg gradient-medical flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          {!isCollapsed && (
            <span className="font-heading font-bold text-lg text-medical-gray-900 truncate">Medical Portal</span>
          )}
        </div>

        {/* User info */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-b border-medical-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Avatar
                isBordered
                color="primary"
                name={profile?.full_name || user?.name}
                size="sm"
                src={user?.picture}
                className="flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-medical-gray-900 truncate">{profile?.full_name || user?.name}</p>
                <p className="text-xs text-medical-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all duration-200 ${
                location.pathname === item.href
                  ? 'text-primary-600 bg-primary-50 font-semibold shadow-sm'
                  : 'text-medical-gray-600 hover:bg-medical-gray-100 hover:text-medical-gray-900'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom: Logout + Collapse */}
        <div className="border-t border-medical-gray-200 p-2 flex-shrink-0">
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl mb-1 text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <FiLogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center w-full px-3 py-2 rounded-xl text-medical-gray-500 hover:bg-medical-gray-100 transition-all duration-200 cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <FiChevronRight className="w-5 h-5" /> : (
              <>
                <FiChevronLeft className="w-5 h-5" />
                <span className="ml-2 text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden bg-white/95 backdrop-blur-md shadow-sm border-b border-medical-gray-200/50 px-4 py-3 flex-shrink-0 z-20">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2 rounded-lg text-medical-gray-600 hover:bg-medical-gray-100"
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-medical flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-heading font-bold text-base text-medical-gray-900">Medical Portal</span>
            </Link>
            <div className="w-9" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
            <Outlet />
          </div>
        </main>

        <footer className="bg-white/80 backdrop-blur-sm border-t border-medical-gray-200/50 py-6 sm:py-8 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center">
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
    </div>
  );
}
