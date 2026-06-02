/**
 * Zod schemas — runtime validation source of truth for the core entities.
 *
 * The backend validates request bodies against the *Input schemas (via the
 * ZodValidationPipe) and the frontends can parse API responses against the
 * entity schemas. TypeScript types are derived with z.infer so the static and
 * runtime contracts cannot drift apart.
 */
import { z } from 'zod';
import { UserRole, ResourceType } from '../types';

export const userRoleSchema = z.nativeEnum(UserRole);
export const resourceTypeSchema = z.nativeEnum(ResourceType);
// Event types are admin-managed (event_types table), so the calendar event's
// `type` is a free-form name referencing event_types.name — not a fixed enum.
export const eventTypeSchema = z.string().trim().min(1);

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
const timeOfDay = z.string().regex(/^\d{2}:\d{2}$/, 'Use a time like 09:00');

export const createCalendarEventSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    start_date: z.string().min(1),
    end_date: z.string().optional(),
    start_time: timeOfDay.optional(),
    end_time: timeOfDay.optional(),
    type: eventTypeSchema,
    subject_id: z.string().uuid().optional(),
    location: z.string().optional(),
    color: z.string().optional(),
  })
  .refine(
    (v) => !v.end_date || v.end_date >= v.start_date,
    { message: 'end_date must be on or after start_date', path: ['end_date'] },
  )
  .refine((v) => !v.end_time || !!v.start_time, {
    message: 'Set a start time before an end time',
    path: ['end_time'],
  });
export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

// ---------------------------------------------------------------------------
// Calendar event type (admin-managed)
// ---------------------------------------------------------------------------
const hexColor = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a hex value like #2f80ed');

export const createCalendarEventTypeSchema = z.object({
  name: z.string().trim().min(1, 'Please enter a type name'),
  color: hexColor.optional(),
  sort_order: z.number().int().optional(),
});
export type CreateCalendarEventTypeInput = z.infer<typeof createCalendarEventTypeSchema>;

export const updateCalendarEventTypeSchema = createCalendarEventTypeSchema.partial();
export type UpdateCalendarEventTypeInput = z.infer<typeof updateCalendarEventTypeSchema>;

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

// ---------------------------------------------------------------------------
// Team member
// ---------------------------------------------------------------------------
// Optional contact/social fields accept a valid value, an empty string (a
// cleared field from the admin form), or null. The service maps blanks to null.
const optionalEmail = z.union([z.string().trim().email(), z.literal('')]).nullable().optional();
const optionalLink = z.union([z.string().trim().url(), z.literal('')]).nullable().optional();
const optionalText = z.string().trim().nullable().optional();

export const createTeamMemberSchema = z.object({
  full_name: z.string().trim().min(1, 'Please enter a name'),
  role: z.string().trim().min(1, 'Please enter a role'),
  bio: optionalText,
  avatar_url: optionalLink,
  email: optionalEmail,
  linkedin_url: optionalLink,
  github_url: optionalLink,
  instagram_url: optionalLink,
  order_index: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;

export const updateTeamMemberSchema = createTeamMemberSchema.partial();
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;

// ---------------------------------------------------------------------------
// News category (admin-managed lookup, mirrors event types)
// ---------------------------------------------------------------------------
export const createNewsCategorySchema = z.object({
  name: z.string().trim().min(1, 'Please enter a category name'),
  color: hexColor.optional(),
  sort_order: z.number().int().optional(),
});
export type CreateNewsCategoryInput = z.infer<typeof createNewsCategorySchema>;

export const updateNewsCategorySchema = createNewsCategorySchema.partial();
export type UpdateNewsCategoryInput = z.infer<typeof updateNewsCategorySchema>;

// ---------------------------------------------------------------------------
// News article
// ---------------------------------------------------------------------------
// category_id accepts a uuid, an empty string (cleared in the admin form) or
// null; the service maps blanks to null. published_at is an ISO date string.
const optionalUuid = z.union([z.string().trim().uuid(), z.literal('')]).nullable().optional();

export const createNewsSchema = z.object({
  title: z.string().trim().min(1, 'Please enter a title'),
  summary: optionalText,
  body: z.string().trim().min(1, 'Please enter the article body'),
  cover_image_url: optionalLink,
  author_name: optionalText,
  category_id: optionalUuid,
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
  published_at: z.string().trim().min(1).optional(),
});
export type CreateNewsInput = z.infer<typeof createNewsSchema>;

export const updateNewsSchema = createNewsSchema.partial();
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
