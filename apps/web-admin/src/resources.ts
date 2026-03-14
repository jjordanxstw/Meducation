/**
 * Refine Resources Configuration
 * Defines menu items and resources for the sidebar
 */

import React from 'react';
import {
  DashboardOutlined,
  BookOutlined,
  PartitionOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  AuditOutlined,
} from '@ant-design/icons';

export const buildResources = (label: (key: string, fallback: string) => string) => [
  {
    name: 'dashboard',
    list: '/dashboard',
    meta: {
      label: label('menu.dashboard', 'Dashboard'),
      icon: React.createElement(DashboardOutlined),
    },
  },
  {
    name: 'subjects',
    list: '/subjects',
    create: '/subjects/create',
    edit: '/subjects/edit/:id',
    show: '/subjects/show/:id',
    meta: {
      label: label('menu.subjects', 'Subjects'),
      icon: React.createElement(BookOutlined),
    },
  },
  {
    name: 'sections',
    list: '/sections',
    create: '/sections/create',
    edit: '/sections/edit/:id',
    meta: {
      label: label('menu.sections', 'Sections'),
      icon: React.createElement(PartitionOutlined),
    },
  },
  {
    name: 'lectures',
    list: '/lectures',
    create: '/lectures/create',
    edit: '/lectures/edit/:id',
    meta: {
      label: label('menu.lectures', 'Lectures'),
      icon: React.createElement(VideoCameraOutlined),
    },
  },
  {
    name: 'resources',
    list: '/resources',
    create: '/resources/create',
    edit: '/resources/edit/:id',
    meta: {
      label: label('menu.resources', 'Resources'),
      icon: React.createElement(FileTextOutlined),
    },
  },
  {
    name: 'calendar',
    list: '/calendar',
    create: '/calendar/create',
    edit: '/calendar/edit/:id',
    meta: {
      label: label('menu.calendar', 'Calendar'),
      icon: React.createElement(CalendarOutlined),
    },
  },
  {
    name: 'profiles',
    list: '/profiles',
    edit: '/profiles/edit/:id',
    show: '/profiles/show/:id',
    meta: {
      label: label('menu.profiles', 'Profiles'),
      icon: React.createElement(UserOutlined),
    },
  },
  {
    name: 'audit-logs',
    list: '/audit-logs',
    meta: {
      label: label('menu.auditLogs', 'Audit Logs'),
      icon: React.createElement(AuditOutlined),
    },
  },
];
