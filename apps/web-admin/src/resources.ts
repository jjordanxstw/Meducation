/**
 * Refine Resources Configuration
 * Defines menu items and resources for the sidebar.
 */

import React from 'react';
import {
  LayoutDashboard,
  Database,
  CalendarDays,
  Tags,
  Megaphone,
  Users,
  UsersRound,
  ScrollText,
} from 'lucide-react';

export const buildResources = () => [
  {
    name: 'dashboard',
    list: '/dashboard',
    meta: {
      label: 'Dashboard',
      icon: React.createElement(LayoutDashboard),
    },
  },
  {
    name: 'resources',
    list: '/resources',
    create: '/resources/create',
    edit: '/resources/edit/:id',
    meta: {
      label: 'Resources',
      icon: React.createElement(Database),
    },
  },
  {
    name: 'calendar',
    list: '/calendar',
    create: '/calendar/create',
    edit: '/calendar/edit/:id',
    meta: {
      label: 'Calendar',
      icon: React.createElement(CalendarDays),
    },
  },
  {
    name: 'event-types',
    list: '/event-types',
    create: '/event-types/create',
    edit: '/event-types/edit/:id',
    meta: {
      label: 'Event Types',
      icon: React.createElement(Tags),
    },
  },
  {
    name: 'announcements',
    list: '/announcements',
    create: '/announcements/create',
    edit: '/announcements/edit/:id',
    meta: {
      label: 'Announcements',
      icon: React.createElement(Megaphone),
    },
  },
  {
    name: 'team-members',
    list: '/team-members',
    create: '/team-members/create',
    edit: '/team-members/edit/:id',
    meta: {
      label: 'Team Members',
      icon: React.createElement(UsersRound),
    },
  },
  {
    name: 'profiles',
    list: '/profiles',
    edit: '/profiles/edit/:id',
    show: '/profiles/show/:id',
    meta: {
      label: 'Profiles',
      icon: React.createElement(Users),
    },
  },
  {
    name: 'audit-logs',
    list: '/audit-logs',
    meta: {
      label: 'Audit Logs',
      icon: React.createElement(ScrollText),
    },
  },
];
