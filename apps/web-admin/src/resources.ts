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

export const resources = [
  {
    name: 'dashboard',
    meta: {
      label: 'Dashboard',
      icon: React.createElement(DashboardOutlined),
      route: '/dashboard',
    },
  },
  {
    name: 'subjects',
    meta: {
      label: 'วิชาเรียน',
      icon: React.createElement(BookOutlined),
      route: '/subjects',
    },
  },
  {
    name: 'sections',
    meta: {
      label: 'หัวข้อเรียน',
      icon: React.createElement(PartitionOutlined),
      route: '/sections',
    },
  },
  {
    name: 'lectures',
    meta: {
      label: 'บทเรียน',
      icon: React.createElement(VideoCameraOutlined),
      route: '/lectures',
    },
  },
  {
    name: 'resources',
    meta: {
      label: 'ทรัพยากรการสอน',
      icon: React.createElement(FileTextOutlined),
      route: '/resources',
    },
  },
  {
    name: 'calendar',
    meta: {
      label: 'ปฏิทินการสอน',
      icon: React.createElement(CalendarOutlined),
      route: '/calendar',
    },
  },
  {
    name: 'profiles',
    meta: {
      label: 'ข้อมูลนักเรียน',
      icon: React.createElement(UserOutlined),
      route: '/profiles',
    },
  },
  {
    name: 'audit-logs',
    meta: {
      label: 'บันทึกกิจกรรม',
      icon: React.createElement(AuditOutlined),
      route: '/audit-logs',
    },
  },
];
