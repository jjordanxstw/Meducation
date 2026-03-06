/**
 * Medical Learning Portal - Shared Utilities
 * Common utility functions used across all apps
 */

import { ResourceType, EventType, UserRole } from '../types';

// =====================================================
// DATE UTILITIES
// =====================================================

/**
 * Format a date string to locale
 */
export function formatDateThai(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format a date string to short format
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a datetime string with time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDateShort(dateString);
}

// =====================================================
// STRING UTILITIES
// =====================================================

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Generate initials from full name
 */
export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Slugify a string for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// =====================================================
// VALIDATION UTILITIES
// =====================================================

/**
 * Validate Mahidol student email
 */
export function isValidMahidolEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9._%+-]+@student\.mahidol\.ac\.th$/;
  return pattern.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return pattern.test(uuid);
}

/**
 * Validate year level (1-6 for medical students)
 */
export function isValidYearLevel(year: number): boolean {
  return Number.isInteger(year) && year >= 1 && year <= 6;
}

// =====================================================
// RESOURCE UTILITIES
// =====================================================

/**
 * Get icon name for resource type
 */
export function getResourceIcon(type: ResourceType): string {
  const icons: Record<ResourceType, string> = {
    [ResourceType.YOUTUBE]: 'video',
    [ResourceType.GDRIVE_VIDEO]: 'film',
    [ResourceType.GDRIVE_PDF]: 'file-text',
    [ResourceType.EXTERNAL]: 'external-link',
  };
  return icons[type] || 'file';
}

/**
 * Get color for resource type
 */
export function getResourceColor(type: ResourceType): string {
  const colors: Record<ResourceType, string> = {
    [ResourceType.YOUTUBE]: '#FF0000',
    [ResourceType.GDRIVE_VIDEO]: '#4285F4',
    [ResourceType.GDRIVE_PDF]: '#34A853',
    [ResourceType.EXTERNAL]: '#0070F3',
  };
  return colors[type] || '#666666';
}

/**
 * Format YouTube URL from video ID
 */
export function getYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Get YouTube embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^[a-zA-Z0-9_-]{11}$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1] || match[0];
  }
  return null;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'N/A';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// =====================================================
// CALENDAR UTILITIES
// =====================================================

/**
 * Get color for calendar event type
 */
export function getEventTypeColor(type: EventType): string {
  const colors: Record<EventType, string> = {
    [EventType.EXAM]: '#DC2626',     // Red
    [EventType.LECTURE]: '#0070F3',  // Blue
    [EventType.HOLIDAY]: '#16A34A',  // Green
    [EventType.EVENT]: '#7C3AED',    // Purple
  };
  return colors[type] || '#666666';
}

/**
 * Get Thai label for event type
 */
export function getEventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    [EventType.EXAM]: 'Exam',
    [EventType.LECTURE]: 'Lecture',
    [EventType.HOLIDAY]: 'Holiday',
    [EventType.EVENT]: 'Event',
  };
  return labels[type] || type;
}

// =====================================================
// USER UTILITIES
// =====================================================

/**
 * Get Thai label for user role
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Admin',
    [UserRole.STUDENT]: 'Student',
  };
  return labels[role] || role;
}

/**
 * Get year level label
 */
export function getYearLevelLabel(year: number): string {
  const numbers = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];
  return `Year ${numbers[year - 1] || year}`;
}

// =====================================================
// WATERMARK UTILITIES
// =====================================================

/**
 * Generate watermark text
 */
export function generateWatermarkText(name: string, studentId?: string): string {
  const id = studentId ? ` (${studentId})` : '';
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${name}${id} - ${timestamp}`;
}

/**
 * Get random position for floating watermark
 */
export function getRandomWatermarkPosition(): { x: number; y: number } {
  return {
    x: Math.random() * 60 + 20, // 20-80%
    y: Math.random() * 60 + 20, // 20-80%
  };
}

// =====================================================
// ARRAY UTILITIES
// =====================================================

/**
 * Reorder items in an array (for drag-and-drop)
 */
export function reorderArray<T>(
  array: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Group array by key
 */
export function groupBy<T, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array by order_index
 */
export function sortByOrder<T extends { order_index: number }>(array: T[]): T[] {
  return [...array].sort((a, b) => a.order_index - b.order_index);
}

// =====================================================
// API UTILITIES
// =====================================================

/**
 * Build query string from params
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Parse API error response
 */
export function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') return err.message;
    if (typeof err.error === 'string') return err.error;
  }
  return 'An unknown error occurred';
}

// =====================================================
// CONSTANTS
// =====================================================

export const MAHIDOL_EMAIL_DOMAIN = '@student.mahidol.ac.th';

export const YEAR_LEVELS = [1, 2, 3, 4, 5, 6] as const;

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  [ResourceType.YOUTUBE]: 'YouTube',
  [ResourceType.GDRIVE_VIDEO]: 'Google Drive Video',
  [ResourceType.GDRIVE_PDF]: 'Google Drive PDF',
  [ResourceType.EXTERNAL]: 'External Link',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.EXAM]: 'Examination',
  [EventType.LECTURE]: 'Lecture',
  [EventType.HOLIDAY]: 'Holiday',
  [EventType.EVENT]: 'Event',
};

export const THEME_COLORS = {
  primary: '#0070F3',
  primaryDark: '#1d4ed8',
  secondary: '#000000',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  error: '#DC2626',
  warning: '#F59E0B',
  success: '#16A34A',
  info: '#0EA5E9',
} as const;
