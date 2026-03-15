/* eslint-disable react-refresh/only-export-components */

/**
 * Main Router Configuration for Medical Portal Admin Panel
 * Uses React Router v6 with Refine.dev v4
 */

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Authenticated } from '@refinedev/core';
import { ThemedLayout } from '@refinedev/antd';
import { AppLayoutHeader } from './layout-header';
import { AppLayoutTitle } from './layout-title';

import { LoginPage } from './auth';
import DashboardPage from './dashboard';
import SubjectsList from './subjects';
import SubjectsCreate from './subjects/create';
import SubjectsEdit from './subjects/edit';
import SubjectsShow from './subjects/show';
import SectionsList from './sections';
import SectionsCreate from './sections/create';
import SectionsEdit from './sections/edit';
import LecturesList from './lectures';
import LecturesCreate from './lectures/create';
import LecturesEdit from './lectures/edit';
import ResourcesList from './resources';
import ResourcesCreate from './resources/create';
import ResourcesEdit from './resources/edit';
import CalendarList from './calendar';
import CalendarCreate from './calendar/create';
import CalendarEdit from './calendar/edit';
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
      background: '#f8fafc',
    }}
  >
    <div className="spinner" />
  </div>
);

// Protected layout wrapper - shared across all authenticated routes
const ProtectedLayout = () => (
  <Authenticated
    key="root-auth"
    redirectOnFail="/login"
    loading={<AuthLoadingFallback />}
  >
    <ThemedLayout Header={AppLayoutHeader} Title={AppLayoutTitle}>
      <Outlet />
    </ThemedLayout>
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
      { path: 'subjects', element: <SubjectsList /> },
      { path: 'subjects/create', element: <SubjectsCreate /> },
      { path: 'subjects/edit/:id', element: <SubjectsEdit /> },
      { path: 'subjects/show/:id', element: <SubjectsShow /> },
      { path: 'sections', element: <SectionsList /> },
      { path: 'sections/create', element: <SectionsCreate /> },
      { path: 'sections/edit/:id', element: <SectionsEdit /> },
      { path: 'lectures', element: <LecturesList /> },
      { path: 'lectures/create', element: <LecturesCreate /> },
      { path: 'lectures/edit/:id', element: <LecturesEdit /> },
      { path: 'resources', element: <ResourcesList /> },
      { path: 'resources/create', element: <ResourcesCreate /> },
      { path: 'resources/edit/:id', element: <ResourcesEdit /> },
      { path: 'calendar', element: <CalendarList /> },
      { path: 'calendar/create', element: <CalendarCreate /> },
      { path: 'calendar/edit/:id', element: <CalendarEdit /> },
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
