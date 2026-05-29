/**
 * Zod schemas — runtime validation source of truth for the core entities.
 *
 * The backend validates request bodies against the *Input schemas (via the
 * ZodValidationPipe) and the frontends can parse API responses against the
 * entity schemas. TypeScript types are derived with z.infer so the static and
 * runtime contracts cannot drift apart.
 */
import { z } from 'zod';
import { UserRole, ResourceType, EventType } from '../types';

export const userRoleSchema = z.nativeEnum(UserRole);
export const resourceTypeSchema = z.nativeEnum(ResourceType);
export const eventTypeSchema = z.nativeEnum(EventType);

const isoDate = z.string().min(1);
const optionalUrl = z.string().url().optional();

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export const profileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().min(1),
  role: userRoleSchema,
  year_level: z.number().int().nullable(),
  avatar_url: z.string().nullable(),
  student_id: z.string().nullable(),
  created_at: isoDate,
  updated_at: isoDate,
});
export type ProfileSchema = z.infer<typeof profileSchema>;

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).optional(),
  year_level: z.number().int().optional(),
  avatar_url: z.string().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ---------------------------------------------------------------------------
// Subject
// ---------------------------------------------------------------------------
export const createSubjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  year_level: z.number().int().min(1).max(8),
  description: z.string().optional(),
  thumbnail_url: optionalUrl,
  order_index: z.number().int().nonnegative().optional(),
});
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = createSubjectSchema.partial().extend({
  is_active: z.boolean().optional(),
});
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------
export const createSectionSchema = z.object({
  subject_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  order_index: z.number().int().nonnegative().optional(),
});
export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export const updateSectionSchema = createSectionSchema.partial().extend({
  is_active: z.boolean().optional(),
});
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------
export const createLectureSchema = z.object({
  subject_id: z.string().uuid(),
  section_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  lecture_date: z.string().optional(),
  lecturer_name: z.string().optional(),
  order_index: z.number().int().nonnegative().optional(),
});
export type CreateLectureInput = z.infer<typeof createLectureSchema>;

export const updateLectureSchema = createLectureSchema.partial().extend({
  is_active: z.boolean().optional(),
});
export type UpdateLectureInput = z.infer<typeof updateLectureSchema>;

// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------
export const createResourceSchema = z.object({
  subject_id: z.string().uuid(),
  section_id: z.string().uuid(),
  lecture_id: z.string().uuid(),
  label: z.string().min(1),
  url: z.string().url(),
  type: resourceTypeSchema,
  file_size_bytes: z.number().int().nonnegative().optional(),
  duration_seconds: z.number().int().nonnegative().optional(),
  order_index: z.number().int().nonnegative().optional(),
});
export type CreateResourceInput = z.infer<typeof createResourceSchema>;

export const updateResourceSchema = createResourceSchema.partial().extend({
  is_active: z.boolean().optional(),
});
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

// ---------------------------------------------------------------------------
// Calendar event
// ---------------------------------------------------------------------------
export const createCalendarEventSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    start_date: z.string().min(1),
    end_date: z.string().optional(),
    type: eventTypeSchema,
    subject_id: z.string().uuid().optional(),
    location: z.string().optional(),
    color: z.string().optional(),
  })
  .refine(
    (v) => !v.end_date || v.end_date >= v.start_date,
    { message: 'end_date must be on or after start_date', path: ['end_date'] },
  );
export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

// ---------------------------------------------------------------------------
// Announcement
// ---------------------------------------------------------------------------
export const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  is_pinned: z.boolean().optional(),
  is_published: z.boolean().optional(),
});
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = createAnnouncementSchema.partial();
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
