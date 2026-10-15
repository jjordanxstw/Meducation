/* eslint-disable react-refresh/only-export-components */

/**
 * Main Router Configuration for Medical Portal Admin Panel
 * Uses React Router v6 with Refine.dev v4
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Authenticated } from '@refinedev/core';
import { AdminShell } from '@/components/layout/AdminShell';

import { LoginPage } from './auth';
const DashboardPage = lazy(() => import('./dashboard'));
const ResourcesList = lazy(() => import('./resources'));
const SubjectsList = lazy(() => import('./subjects'));
const SubjectsEdit = lazy(() => import('./subjects/edit'));
const CalendarList = lazy(() => import('./calendar'));
const CalendarCreate = lazy(() => import('./calendar/create'));
const CalendarEdit = lazy(() => import('./calendar/edit'));
const AnnouncementsList = lazy(() => import('./announcements'));
const AnnouncementsCreate = lazy(() => import('./announcements/create'));
const AnnouncementsEdit = lazy(() => import('./announcements/edit'));
const TeamMembersList = lazy(() => import('./team-members'));
const TeamMembersCreate = lazy(() => import('./team-members/create'));
const TeamMembersEdit = lazy(() => import('./team-members/edit'));
const NewsList = lazy(() => import('./news'));
const NewsCreate = lazy(() => import('./news/create'));
const NewsEdit = lazy(() => import('./news/edit'));
const LearningResourcesList = lazy(() => import('./learning-resources'));
const LearningResourcesCreate = lazy(() => import('./learning-resources/create'));
const LearningResourcesEdit = lazy(() => import('./learning-resources/edit'));
const ProfilesList = lazy(() => import('./profiles'));
const ProfilesEdit = lazy(() => import('./profiles/edit'));
const ProfilesShow = lazy(() => import('./profiles/show'));
const AuditLogsList = lazy(() => import('./audit-logs'));
const TaxonomiesPage = lazy(() => import('./taxonomies'));

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

const PageLoadingFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
    <div className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
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
      {/* Each page is its own chunk (lazy routes), so the first load stays small. */}
      <Suspense fallback={<PageLoadingFallback />}>
        <Outlet />
      </Suspense>
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
      { path: 'subjects', element: <SubjectsList /> },
      { path: 'subjects/create', element: <Navigate to="/subjects?new=1" replace /> },
      { path: 'subjects/edit/:id', element: <SubjectsEdit /> },
      { path: 'subjects/show/:id', element: <Navigate to="/subjects" replace /> },
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
      { path: 'event-types', element: <TaxonomiesPage /> },
      { path: 'event-types/create', element: <Navigate to="/event-types" replace /> },
      { path: 'event-types/edit/:id', element: <Navigate to="/event-types" replace /> },
      { path: 'announcements', element: <AnnouncementsList /> },
      { path: 'announcements/create', element: <AnnouncementsCreate /> },
      { path: 'announcements/edit/:id', element: <AnnouncementsEdit /> },
      { path: 'team-members', element: <TeamMembersList /> },
      { path: 'team-members/create', element: <TeamMembersCreate /> },
      { path: 'team-members/edit/:id', element: <TeamMembersEdit /> },
      { path: 'news', element: <NewsList /> },
      { path: 'news/create', element: <NewsCreate /> },
      { path: 'news/edit/:id', element: <NewsEdit /> },
      { path: 'news-categories', element: <TaxonomiesPage /> },
      { path: 'news-categories/create', element: <Navigate to="/news-categories" replace /> },
      { path: 'news-categories/edit/:id', element: <Navigate to="/news-categories" replace /> },
      { path: 'learning-resources', element: <LearningResourcesList /> },
      { path: 'learning-resources/create', element: <LearningResourcesCreate /> },
      { path: 'learning-resources/edit/:id', element: <LearningResourcesEdit /> },
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
