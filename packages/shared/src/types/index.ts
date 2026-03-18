/**
 * Medical Learning Portal - Shared Types
 * Core type definitions for the entire application
 */

// =====================================================
// ENUMS
// =====================================================

export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
}

export enum ResourceType {
  YOUTUBE = 'youtube',
  GDRIVE_VIDEO = 'gdrive_video',
  GDRIVE_PDF = 'gdrive_pdf',
  EXTERNAL = 'external',
}

export enum EventType {
  EXAM = 'exam',
  LECTURE = 'lecture',
  HOLIDAY = 'holiday',
  EVENT = 'event',
}

export enum AuditAction {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

// =====================================================
// BASE TYPES
// =====================================================

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface OrderableEntity {
  order_index: number;
  is_active: boolean;
}

// =====================================================
// USER / PROFILE
// =====================================================

export interface Profile extends BaseEntity {
  email: string;
  full_name: string;
  role: UserRole;
  year_level: number | null;
  avatar_url: string | null;
  student_id: string | null;
}

export interface CreateProfileDto {
  email: string;
  full_name: string;
  role?: UserRole;
  year_level?: number;
  student_id?: string;
}

export interface UpdateProfileDto {
  full_name?: string;
  year_level?: number;
  avatar_url?: string;
}

// =====================================================
// SUBJECT
// =====================================================

export interface Subject extends BaseEntity, OrderableEntity {
  name: string;
  code: string;
  year_level: number;
  description: string | null;
  thumbnail_url: string | null;
}

export interface CreateSubjectDto {
  name: string;
  code: string;
  year_level: number;
  description?: string;
  thumbnail_url?: string;
  order_index?: number;
}

export interface UpdateSubjectDto extends Partial<CreateSubjectDto> {
  is_active?: boolean;
}

// =====================================================
// SECTION
// =====================================================

export interface Section extends BaseEntity, OrderableEntity {
  subject_id: string;
  name: string;
  description: string | null;
}

export interface CreateSectionDto {
  subject_id: string;
  name: string;
  description?: string;
  order_index?: number;
}

export interface UpdateSectionDto extends Partial<CreateSectionDto> {
  is_active?: boolean;
}

// Section with nested lectures
export interface SectionWithLectures extends Section {
  lectures: LectureWithResources[];
}

// =====================================================
// LECTURE
// =====================================================

export interface Lecture extends BaseEntity, OrderableEntity {
  section_id: string;
  title: string;
  description: string | null;
  lecture_date: string | null;
  lecturer_name: string | null;
}

export interface CreateLectureDto {
  subject_id: string;
  section_id: string;
  title: string;
  description?: string;
  lecture_date?: string;
  lecturer_name?: string;
  order_index?: number;
}

export interface UpdateLectureDto extends Partial<CreateLectureDto> {
  is_active?: boolean;
}

// Lecture with nested resources
export interface LectureWithResources extends Lecture {
  resources: Resource[];
}

// =====================================================
// RESOURCE
// =====================================================

export interface Resource extends BaseEntity, OrderableEntity {
  lecture_id: string;
  label: string;
  url: string;
  type: ResourceType;
  file_size_bytes: number | null;
  duration_seconds: number | null;
}

export interface CreateResourceDto {
  subject_id: string;
  section_id: string;
  lecture_id: string;
  label: string;
  url: string;
  type: ResourceType;
  file_size_bytes?: number;
  duration_seconds?: number;
  order_index?: number;
}

export interface UpdateResourceDto extends Partial<CreateResourceDto> {
  is_active?: boolean;
}

// =====================================================
// CALENDAR EVENT
// =====================================================

export interface CalendarEvent extends BaseEntity {
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  type: EventType;
  subject_id: string | null;
  is_all_day: boolean;
  location: string | null;
  color: string | null;
  created_by: string | null;
}

export interface CreateCalendarEventDto {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  type: EventType;
  subject_id?: string;
  is_all_day?: boolean;
  location?: string;
  color?: string;
}

export interface UpdateCalendarEventDto extends Partial<CreateCalendarEventDto> {}

// =====================================================
// AUDIT LOG
// =====================================================

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  table_name: string;
  record_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface CreateAuditLogDto {
  user_id?: string;
  action: AuditAction;
  table_name: string;
  record_id: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

// =====================================================
// NESTED / HIERARCHICAL TYPES
// =====================================================

export interface SubjectWithSections extends Subject {
  sections: SectionWithLectures[];
}

export interface SubjectHierarchy {
  subject: Subject;
  sections: {
    section: Section;
    lectures: {
      lecture: Lecture;
      resources: Resource[];
    }[];
  }[];
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// =====================================================
// AUTH TYPES
// =====================================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  hd?: string;
  email: string;
  email_verified: boolean;
  at_hash?: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  iat: number;
  exp: number;
}

export interface AuthSession {
  user: AuthUser;
  profile: Profile;
  accessToken: string;
  expiresAt: number;
}

// =====================================================
// WATERMARK CONFIG
// =====================================================

export interface WatermarkConfig {
  text: string;
  userId: string;
  email: string;
  opacity?: number;
  fontSize?: number;
  color?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'random';
  rotation?: number;
}

// =====================================================
// FILTER & QUERY TYPES
// =====================================================

export interface SubjectFilters {
  year_level?: number;
  is_active?: boolean;
  search?: string;
}

export interface CalendarFilters {
  start_date?: string;
  end_date?: string;
  type?: EventType;
  subject_id?: string;
}

export interface AuditLogFilters {
  user_id?: string;
  action?: AuditAction;
  table_name?: string;
  start_date?: string;
  end_date?: string;
}
