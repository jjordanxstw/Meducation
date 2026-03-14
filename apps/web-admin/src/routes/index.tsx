/**
 * Main Router Configuration for Medical Portal Admin Panel
 * Uses React Router v6 with Refine.dev v4
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Authenticated } from '@refinedev/core';
import { ThemedLayout } from '@refinedev/antd';
import React from 'react';

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

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Authenticated
    key="protected-auth"
    redirectOnFail="/"
    loading={<AuthLoadingFallback />}
  >
    <ThemedLayout>
      {children}
    </ThemedLayout>
  </Authenticated>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
  },
  {
    path: '/subjects',
    element: <ProtectedRoute><SubjectsList /></ProtectedRoute>,
  },
  {
    path: '/subjects/create',
    element: <ProtectedRoute><SubjectsCreate /></ProtectedRoute>,
  },
  {
    path: '/subjects/edit/:id',
    element: <ProtectedRoute><SubjectsEdit /></ProtectedRoute>,
  },
  {
    path: '/subjects/show/:id',
    element: <ProtectedRoute><SubjectsShow /></ProtectedRoute>,
  },
  {
    path: '/sections',
    element: <ProtectedRoute><SectionsList /></ProtectedRoute>,
  },
  {
    path: '/sections/create',
    element: <ProtectedRoute><SectionsCreate /></ProtectedRoute>,
  },
  {
    path: '/sections/edit/:id',
    element: <ProtectedRoute><SectionsEdit /></ProtectedRoute>,
  },
  {
    path: '/lectures',
    element: <ProtectedRoute><LecturesList /></ProtectedRoute>,
  },
  {
    path: '/lectures/create',
    element: <ProtectedRoute><LecturesCreate /></ProtectedRoute>,
  },
  {
    path: '/lectures/edit/:id',
    element: <ProtectedRoute><LecturesEdit /></ProtectedRoute>,
  },
  {
    path: '/resources',
    element: <ProtectedRoute><ResourcesList /></ProtectedRoute>,
  },
  {
    path: '/resources/create',
    element: <ProtectedRoute><ResourcesCreate /></ProtectedRoute>,
  },
  {
    path: '/resources/edit/:id',
    element: <ProtectedRoute><ResourcesEdit /></ProtectedRoute>,
  },
  {
    path: '/calendar',
    element: <ProtectedRoute><CalendarList /></ProtectedRoute>,
  },
  {
    path: '/calendar/create',
    element: <ProtectedRoute><CalendarCreate /></ProtectedRoute>,
  },
  {
    path: '/calendar/edit/:id',
    element: <ProtectedRoute><CalendarEdit /></ProtectedRoute>,
  },
  {
    path: '/profiles',
    element: <ProtectedRoute><ProfilesList /></ProtectedRoute>,
  },
  {
    path: '/profiles/edit/:id',
    element: <ProtectedRoute><ProfilesEdit /></ProtectedRoute>,
  },
  {
    path: '/profiles/show/:id',
    element: <ProtectedRoute><ProfilesShow /></ProtectedRoute>,
  },
  {
    path: '/audit-logs',
    element: <ProtectedRoute><AuditLogsList /></ProtectedRoute>,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
