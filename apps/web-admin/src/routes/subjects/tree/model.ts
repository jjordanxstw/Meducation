/**
 * Form model for the subject tree editor: zod schema, empty rows, link type
 * detection and the "N unsaved changes" diff against the loaded tree.
 */
import { z } from 'zod';
import { ResourceType } from '@medical-portal/shared';
import type { SubjectEditableTree } from '@medical-portal/shared';

const resourceSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1, 'Enter a label'),
  url: z.string().trim().min(1, 'Enter a link'),
  type: z.nativeEnum(ResourceType),
  is_active: z.boolean(),
});

const lectureSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, 'Enter a title'),
  description: z.string().trim().optional(),
  lecture_date: z.string().optional(),
  lecturer_name: z.string().trim().optional(),
  is_active: z.boolean(),
  resources: z.array(resourceSchema),
});

const sectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Enter a section name'),
  description: z.string().trim().optional(),
  is_active: z.boolean(),
  lectures: z.array(lectureSchema),
});

export const treeSchema = z.object({
  code: z.string().trim().min(1, 'Please enter a code'),
  name: z.string().trim().min(1, 'Please enter a name'),
  year_level: z.number().int().min(1, 'Year must be 1–6').max(6, 'Year must be 1–6'),
  description: z.string().trim().optional(),
  thumbnail_url: z.string().trim().optional(),
  order_index: z.number().int().nonnegative(),
  is_active: z.boolean(),
  sections: z.array(sectionSchema),
});

export type TreeValues = z.infer<typeof treeSchema>;
export type LectureValues = TreeValues['sections'][number]['lectures'][number];

export const emptyResource = () => ({ label: '', url: '', type: ResourceType.YOUTUBE, is_active: true });
export const emptyLecture = (): LectureValues => ({
  title: '',
  description: '',
  lecture_date: '',
  lecturer_name: '',
  is_active: true,
  resources: [],
});
export const emptySection = (name = '') => ({ name, description: '', is_active: true, lectures: [] as LectureValues[] });

export const EMPTY_TREE: TreeValues = {
  code: '',
  name: '',
  year_level: 1,
  description: '',
  thumbnail_url: '',
  order_index: 0,
  is_active: true,
  sections: [],
};

export function toFormValues(tree: SubjectEditableTree): TreeValues {
  return {
    code: tree.code ?? '',
    name: tree.name ?? '',
    year_level: tree.year_level ?? 1,
    description: tree.description ?? '',
    thumbnail_url: tree.thumbnail_url ?? '',
    order_index: tree.order_index ?? 0,
    is_active: tree.is_active ?? true,
    sections: (tree.sections ?? []).map((section) => ({
      id: section.id,
      name: section.name ?? '',
      description: section.description ?? '',
      is_active: section.is_active ?? true,
      lectures: (section.lectures ?? []).map((lecture) => ({
        id: lecture.id,
        title: lecture.title ?? '',
        description: lecture.description ?? '',
        lecture_date: lecture.lecture_date ?? '',
        lecturer_name: lecture.lecturer_name ?? '',
        is_active: lecture.is_active ?? true,
        resources: (lecture.resources ?? []).map((resource) => ({
          id: resource.id,
          label: resource.label ?? '',
          url: resource.url ?? '',
          type: resource.type,
          is_active: resource.is_active ?? true,
        })),
      })),
    })),
  };
}

export function toPayload(id: string, values: TreeValues, expectedVersion: string | undefined) {
  return {
    subject_id: id,
    expected_version: expectedVersion,
    subject: {
      code: values.code.trim(),
      name: values.name.trim(),
      year_level: values.year_level,
      description: values.description?.trim() || null,
      thumbnail_url: values.thumbnail_url?.trim() || null,
      order_index: values.order_index,
      is_active: values.is_active,
    },
    sections: values.sections.map((section) => ({
      id: section.id,
      name: section.name.trim(),
      description: section.description?.trim() || null,
      is_active: section.is_active,
      lectures: section.lectures.map((lecture) => ({
        id: lecture.id,
        title: lecture.title.trim(),
        description: lecture.description?.trim() || null,
        lecture_date: lecture.lecture_date || null,
        lecturer_name: lecture.lecturer_name?.trim() || null,
        is_active: lecture.is_active,
        resources: lecture.resources.map((resource) => ({
          id: resource.id,
          label: resource.label.trim(),
          url: resource.url.trim(),
          type: resource.type,
          is_active: resource.is_active,
        })),
      })),
    })),
  };
}

/**
 * Guess the resource type (and a default label) from a pasted URL. Only
 * unambiguous cases are changed: Drive links keep a Drive type the admin
 * already chose, since a Drive URL alone can't tell a PDF from a video.
 */
export function detectResource(url: string, currentType: ResourceType): { type: ResourceType; label: string } | null {
  let host = '';
  try {
    host = new URL(url.trim()).hostname.replace(/^www\.|^m\./, '');
  } catch {
    return /^[a-zA-Z0-9_-]{11}$/.test(url.trim()) ? { type: ResourceType.YOUTUBE, label: 'Lecture recording' } : null;
  }
  if (host === 'youtu.be' || host.endsWith('youtube.com')) return { type: ResourceType.YOUTUBE, label: 'Lecture recording' };
  if (host === 'drive.google.com' || host === 'docs.google.com') {
    const type = currentType === ResourceType.GDRIVE_VIDEO ? ResourceType.GDRIVE_VIDEO : ResourceType.GDRIVE_PDF;
    return { type, label: type === ResourceType.GDRIVE_VIDEO ? 'Lecture recording' : 'Slides' };
  }
  return { type: ResourceType.EXTERNAL, label: host };
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * Human summary of what changed since the tree was loaded, for the sticky
 * save bar: "Section 2 reordered · 1 lecture added · 1 link edited".
 */
export function describeChanges(original: TreeValues, current: TreeValues): { count: number; summary: string } {
  const parts: string[] = [];
  let count = 0;
  const add = (n: number, text: string) => {
    if (n > 0) {
      count += n;
      parts.push(text);
    }
  };

  const detailKeys = ['code', 'name', 'year_level', 'description', 'thumbnail_url', 'order_index', 'is_active'] as const;
  add(detailKeys.some((key) => (original[key] ?? '') !== (current[key] ?? '')) ? 1 : 0, 'Details edited');

  const origSections = new Map(original.sections.filter((s) => s.id).map((s) => [s.id!, s]));
  const currSectionIds = new Set(current.sections.map((s) => s.id).filter(Boolean));
  const origLectures = new Map(original.sections.flatMap((s) => s.lectures.filter((l) => l.id).map((l) => [l.id!, l] as const)));
  const currLectureIds = new Set(current.sections.flatMap((s) => s.lectures.map((l) => l.id)).filter(Boolean));
  const origResources = new Map(
    original.sections.flatMap((s) => s.lectures.flatMap((l) => l.resources.filter((r) => r.id).map((r) => [r.id!, r] as const))),
  );
  const currResourceIds = new Set(current.sections.flatMap((s) => s.lectures.flatMap((l) => l.resources.map((r) => r.id))).filter(Boolean));

  let sectionsEdited = 0;
  const reordered: string[] = [];
  let lecturesEdited = 0;
  let linksAdded = 0;
  let linksEdited = 0;

  const kept = (ids: Array<string | undefined>, alive: Set<string | undefined>) => ids.filter((id) => id && alive.has(id));
  const sameOrder = (a: Array<string | undefined>, b: Array<string | undefined>) => a.length === b.length && a.every((id, i) => id === b[i]);

  if (!sameOrder(kept(original.sections.map((s) => s.id), currSectionIds), kept(current.sections.map((s) => s.id), new Set(origSections.keys())))) {
    reordered.push('Sections');
  }

  current.sections.forEach((section, sectionIndex) => {
    const before = section.id ? origSections.get(section.id) : undefined;
    if (before) {
      if (before.name !== section.name || (before.description ?? '') !== (section.description ?? '') || before.is_active !== section.is_active) {
        sectionsEdited += 1;
      }
      const beforeIds = kept(before.lectures.map((l) => l.id), new Set(section.lectures.map((l) => l.id)));
      const afterIds = kept(section.lectures.map((l) => l.id), new Set(before.lectures.map((l) => l.id)));
      if (!sameOrder(beforeIds, afterIds)) reordered.push(`Section ${sectionIndex + 1}`);
    }
    for (const lecture of section.lectures) {
      const prev = lecture.id ? origLectures.get(lecture.id) : undefined;
      if (
        prev &&
        (prev.title !== lecture.title ||
          (prev.lecturer_name ?? '') !== (lecture.lecturer_name ?? '') ||
          (prev.lecture_date ?? '') !== (lecture.lecture_date ?? '') ||
          (prev.description ?? '') !== (lecture.description ?? '') ||
          prev.is_active !== lecture.is_active ||
          !before ||
          !before.lectures.some((l) => l.id === lecture.id))
      ) {
        lecturesEdited += 1;
      }
      for (const resource of lecture.resources) {
        const old = resource.id ? origResources.get(resource.id) : undefined;
        if (!old) linksAdded += 1;
        else if (old.label !== resource.label || old.url !== resource.url || old.type !== resource.type || old.is_active !== resource.is_active) {
          linksEdited += 1;
        }
      }
    }
  });

  const sectionsAdded = current.sections.filter((s) => !s.id).length;
  const sectionsRemoved = [...origSections.keys()].filter((id) => !currSectionIds.has(id)).length;
  const lecturesAdded = current.sections.reduce((sum, s) => sum + s.lectures.filter((l) => !l.id).length, 0);
  const lecturesRemoved = [...origLectures.keys()].filter((id) => !currLectureIds.has(id)).length;
  const linksRemoved = [...origResources.keys()].filter((id) => !currResourceIds.has(id)).length;

  for (const label of reordered) add(1, `${label} reordered`);
  add(sectionsAdded, `${plural(sectionsAdded, 'section')} added`);
  add(sectionsEdited, `${plural(sectionsEdited, 'section')} edited`);
  add(sectionsRemoved, `${plural(sectionsRemoved, 'section')} removed`);
  add(lecturesAdded, `${plural(lecturesAdded, 'lecture')} added`);
  add(lecturesEdited, `${plural(lecturesEdited, 'lecture')} edited`);
  add(lecturesRemoved, `${plural(lecturesRemoved, 'lecture')} removed`);
  add(linksAdded, `${plural(linksAdded, 'link')} added`);
  add(linksEdited, `${plural(linksEdited, 'link')} edited`);
  add(linksRemoved, `${plural(linksRemoved, 'link')} removed`);

  return { count, summary: parts.join(' · ') };
}

/** YouTube video id from any watch/short/embed link (or a bare id). */
export function youtubeVideoId(url: string): string | null {
  const match = url.trim().match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  return /^[a-zA-Z0-9_-]{11}$/.test(url.trim()) ? url.trim() : null;
}
