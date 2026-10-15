import { useMemo } from 'react';
import { useApiUrl, useCustom } from '@refinedev/core';

export type LectureRef = { id: string; title: string; subjectId: string; subjectCode: string; sectionName: string };
export type SectionRef = { id: string; name: string; subjectId: string; subjectCode: string };
export type SubjectRef = { id: string; code: string; name: string };
export type Bucket<T> = { count: number; items: T[] };

export type Attention = {
  lecturesWithoutFiles: Bucket<LectureRef>;
  lecturesWithoutVideo: Bucket<LectureRef>;
  lecturesMissingDetails: Bucket<LectureRef>;
  emptySections: Bucket<SectionRef>;
  emptySubjects: Bucket<SubjectRef>;
  hiddenSubjects: Bucket<SubjectRef>;
  duplicateLinks: Bucket<{ url: string; lectures: LectureRef[] }>;
  hiddenSections: Bucket<SectionRef>;
  yearsWithoutUpcomingEvents: Bucket<{ yearLevel: number; lastEventDate: string | null }>;
  unpublishedNews: { count: number };
};

/** Problems that would make students hit an empty or confusing screen. */
export const ATTENTION_KEYS = [
  'lecturesWithoutFiles',
  'duplicateLinks',
  'hiddenSections',
  'yearsWithoutUpcomingEvents',
  'emptySections',
  'emptySubjects',
  'lecturesWithoutVideo',
  'lecturesMissingDetails',
  'unpublishedNews',
] as const;

export function useAttention() {
  const apiUrl = useApiUrl();
  const query = useCustom<Attention>({ url: `${apiUrl}/admin/statistics/attention`, method: 'get' });
  const data = (query.data?.data as unknown as { data?: Attention })?.data ?? null;
  const total = useMemo(() => (data ? ATTENTION_KEYS.reduce((sum, key) => sum + (data[key]?.count ?? 0), 0) : 0), [data]);
  return { data, total, isError: query.isError };
}

export type AttentionState = ReturnType<typeof useAttention>;
