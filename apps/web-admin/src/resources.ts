/**
 * Refine Resources Configuration
 * Defines menu items and resources for the sidebar.
 */

import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Files,
  BookOpenText,
  History,
  Contact,
  CalendarDays,
  Tags,
  Megaphone,
  Users,
  Newspaper,
  Tag,
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
    name: 'subjects',
    list: '/subjects',
    create: '/subjects/create',
    edit: '/subjects/edit/:id',
    meta: {
      label: 'Subjects & lectures',
      icon: React.createElement(Layers),
    },
  },
  {
    // Read-only cross-subject search view. All resource editing now happens in the
    // unified subject tree editor (Subjects → edit), so no create/edit routes here.
    name: 'resources',
    list: '/resources',
    meta: {
      label: 'All files',
      icon: React.createElement(Files),
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
      label: 'Event types',
      icon: React.createElement(Tags),
      parent: 'calendar',
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
      label: 'Team members',
      icon: React.createElement(Contact),
    },
  },
  {
    name: 'news',
    list: '/news',
    create: '/news/create',
    edit: '/news/edit/:id',
    meta: {
      label: 'News',
      icon: React.createElement(Newspaper),
    },
  },
  {
    name: 'news-categories',
    list: '/news-categories',
    create: '/news-categories/create',
    edit: '/news-categories/edit/:id',
    meta: {
      label: 'Categories',
      icon: React.createElement(Tag),
      parent: 'news',
    },
  },
  {
    name: 'learning-resources',
    list: '/learning-resources',
    create: '/learning-resources/create',
    edit: '/learning-resources/edit/:id',
    meta: {
      label: 'Learning Hub',
      icon: React.createElement(BookOpenText),
    },
  },
  {
    name: 'profiles',
    list: '/profiles',
    edit: '/profiles/edit/:id',
    show: '/profiles/show/:id',
    meta: {
      label: 'Students',
      icon: React.createElement(Users),
    },
  },
  {
    name: 'audit-logs',
    list: '/audit-logs',
    meta: {
      label: 'Audit log',
      icon: React.createElement(History),
    },
  },
];
