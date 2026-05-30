/**
 * Refine Resources Configuration
 * Defines menu items and resources for the sidebar.
 */

import React from 'react';
import {
  BarChartOutlined,
  DatabaseOutlined,
  CalendarOutlined,
  NotificationOutlined,
  TeamOutlined,
  AuditOutlined,
} from '@ant-design/icons';

export const buildResources = () => [
  {
    name: 'dashboard',
    list: '/dashboard',
    meta: {
      label: 'Dashboard',
      icon: React.createElement(BarChartOutlined),
    },
  },
  {
    name: 'resources',
    list: '/resources',
    create: '/resources/create',
    edit: '/resources/edit/:id',
    meta: {
      label: 'Resources',
      icon: React.createElement(DatabaseOutlined),
    },
  },
  {
    name: 'calendar',
    list: '/calendar',
    create: '/calendar/create',
    edit: '/calendar/edit/:id',
    meta: {
      label: 'Calendar',
      icon: React.createElement(CalendarOutlined),
    },
  },
  {
    name: 'announcements',
    list: '/announcements',
    create: '/announcements/create',
    edit: '/announcements/edit/:id',
    meta: {
      label: 'Announcements',
      icon: React.createElement(NotificationOutlined),
    },
  },
  {
    name: 'profiles',
    list: '/profiles',
    edit: '/profiles/edit/:id',
    show: '/profiles/show/:id',
    meta: {
      label: 'Profiles',
      icon: React.createElement(TeamOutlined),
    },
  },
  {
    name: 'audit-logs',
    list: '/audit-logs',
    meta: {
      label: 'Audit Logs',
      icon: React.createElement(AuditOutlined),
    },
  },
];
