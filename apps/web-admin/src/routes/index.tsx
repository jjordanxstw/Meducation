/* eslint-disable react-refresh/only-export-components */

/**
 * Main Router Configuration for Medical Portal Admin Panel
 * Uses React Router v6 with Refine.dev v4
 */

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Authenticated } from '@refinedev/core';
import { AdminShell } from '@/components/layout/AdminShell';

import { LoginPage } from './auth';
import DashboardPage from './dashboard';
import ResourcesList from './resources';
import CalendarList from './calendar';
import CalendarCreate from './calendar/create';
import CalendarEdit from './calendar/edit';
import EventTypesList from './event-types';
import EventTypesCreate from './event-types/create';
import EventTypesEdit from './event-types/edit';
import AnnouncementsList from './announcements';
import AnnouncementsCreate from './announcements/create';
import AnnouncementsEdit from './announcements/edit';
import ProfilesList from './profiles';
import ProfilesEdit from './profiles/edit';
import ProfilesShow from './profiles/show';
import AuditLogsList from './audit-logs';

// Loading component
const AuthLoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f4f8ff',
    }}
  >
    <div className="spinner" />
  </div>
);

// Protected layout wrapper - shared across all authenticated routes.
const ProtectedLayout = () => (
  <Authenticated
    key="root-auth"
    redirectOnFail="/login"
    loading={<AuthLoadingFallback />}
  >
    <AdminShell>
      <Outlet />
    </AdminShell>
  </Authenticated>
);

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'subjects', element: <Navigate to="/resources" replace /> },
      { path: 'subjects/create', element: <Navigate to="/resources" replace /> },
      { path: 'subjects/edit/:id', element: <Navigate to="/resources" replace /> },
      { path: 'subjects/show/:id', element: <Navigate to="/resources" replace /> },
      { path: 'sections', element: <Navigate to="/resources" replace /> },
      { path: 'sections/create', element: <Navigate to="/resources" replace /> },
      { path: 'sections/edit/:id', element: <Navigate to="/resources" replace /> },
      { path: 'lectures', element: <Navigate to="/resources" replace /> },
      { path: 'lectures/create', element: <Navigate to="/resources" replace /> },
      { path: 'lectures/edit/:id', element: <Navigate to="/resources" replace /> },
      { path: 'resources', element: <ResourcesList /> },
      { path: 'resources/create', element: <Navigate to="/resources" replace /> },
      { path: 'resources/edit/:id', element: <Navigate to="/resources" replace /> },
      { path: 'calendar', element: <CalendarList /> },
      { path: 'calendar/create', element: <CalendarCreate /> },
      { path: 'calendar/edit/:id', element: <CalendarEdit /> },
      { path: 'event-types', element: <EventTypesList /> },
      { path: 'event-types/create', element: <EventTypesCreate /> },
      { path: 'event-types/edit/:id', element: <EventTypesEdit /> },
      { path: 'announcements', element: <AnnouncementsList /> },
      { path: 'announcements/create', element: <AnnouncementsCreate /> },
      { path: 'announcements/edit/:id', element: <AnnouncementsEdit /> },
      { path: 'profiles', element: <ProfilesList /> },
      { path: 'profiles/edit/:id', element: <ProfilesEdit /> },
      { path: 'profiles/show/:id', element: <ProfilesShow /> },
      { path: 'audit-logs', element: <AuditLogsList /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
