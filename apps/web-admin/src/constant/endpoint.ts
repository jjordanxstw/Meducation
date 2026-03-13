/**
 * API Endpoints
 * Centralized endpoint definitions
 */

export const ENDPOINTS = {
  // Auth endpoints (admin)
  AUTH: {
    LOGIN: '/admin/auth/login',
    LOGOUT: '/admin/auth/logout',
    VERIFY: '/admin/auth/verify',
    ME: '/admin/auth/me',
    FORGOT_PASSWORD: '/admin/auth/forgot-password',
    RESET_PASSWORD: '/admin/auth/reset-password',
  },

  // Subject endpoints
  SUBJECTS: {
    LIST: '/subjects',
    DETAIL: (id: string) => `/subjects/${id}`,
    CREATE: '/subjects',
    UPDATE: (id: string) => `/subjects/${id}`,
    DELETE: (id: string) => `/subjects/${id}`,
  },

  // Section endpoints
  SECTIONS: {
    LIST: '/sections',
    DETAIL: (id: string) => `/sections/${id}`,
    CREATE: '/sections',
    UPDATE: (id: string) => `/sections/${id}`,
    DELETE: (id: string) => `/sections/${id}`,
  },

  // Lecture endpoints
  LECTURES: {
    LIST: '/lectures',
    DETAIL: (id: string) => `/lectures/${id}`,
    CREATE: '/lectures',
    UPDATE: (id: string) => `/lectures/${id}`,
    DELETE: (id: string) => `/lectures/${id}`,
  },

  // Resource endpoints
  RESOURCES: {
    LIST: '/resources',
    DETAIL: (id: string) => `/resources/${id}`,
    CREATE: '/resources',
    UPDATE: (id: string) => `/resources/${id}`,
    DELETE: (id: string) => `/resources/${id}`,
  },

  // Calendar endpoints
  CALENDAR: {
    LIST: '/calendar',
    DETAIL: (id: string) => `/calendar/${id}`,
    CREATE: '/calendar',
    UPDATE: (id: string) => `/calendar/${id}`,
    DELETE: (id: string) => `/calendar/${id}`,
  },

  // Profile endpoints
  PROFILES: {
    LIST: '/profiles',
    DETAIL: (id: string) => `/profiles/${id}`,
    UPDATE: (id: string) => `/profiles/${id}`,
    ME: '/profiles/me',
  },

  // Audit log endpoints
  AUDIT_LOGS: {
    LIST: '/audit-logs',
  },
};

export default ENDPOINTS;
