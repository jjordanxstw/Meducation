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
    list: '/dashboard',
    meta: {
      label: 'Dashboard',
      icon: React.createElement(DashboardOutlined),
    },
  },
  {
    name: 'subjects',
    list: '/subjects',
    meta: {
      label: 'วิชาเรียน',
      icon: React.createElement(BookOutlined),
    },
  },
  {
    name: 'sections',
    list: '/sections',
    meta: {
      label: 'หัวข้อเรียน',
      icon: React.createElement(PartitionOutlined),
    },
  },
  {
    name: 'lectures',
    list: '/lectures',
    meta: {
      label: 'บทเรียน',
      icon: React.createElement(VideoCameraOutlined),
    },
  },
  {
    name: 'resources',
    list: '/resources',
    meta: {
      label: 'ทรัพยากรการสอน',
      icon: React.createElement(FileTextOutlined),
    },
  },
  {
    name: 'calendar',
    list: '/calendar',
    meta: {
      label: 'ปฏิทินการสอน',
      icon: React.createElement(CalendarOutlined),
    },
  },
  {
    name: 'profiles',
    list: '/profiles',
    meta: {
      label: 'ข้อมูลนักเรียน',
      icon: React.createElement(UserOutlined),
    },
  },
  {
    name: 'audit-logs',
    list: '/audit-logs',
    meta: {
      label: 'บันทึกกิจกรรม',
      icon: React.createElement(AuditOutlined),
    },
  },
];
