import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Lecture, News, SubjectWithStats } from '@medical-portal/shared';
import { useSubjects } from '@/hooks/use-subjects';
import { useHotNews } from '@/hooks/use-hot-news';

type LectureRow = Lecture & { section_id: string };
type SectionRow = { id: string; subject_id: string; name: string; order_index: number };

export type SearchKind = 'lecture' | 'lecturer' | 'subject' | 'news';
export type SearchScope = 'all' | 'lecture' | 'subject' | 'lecturer';

export type SearchHit = {
  kind: SearchKind;
  id: string;
  href: string;
  title: string;
  subtitle: string;
  score: number;
  yearLevel?: number;
};

/** Rendered group order (Brilliant: Search palette). */
export const SEARCH_KIND_ORDER: SearchKind[] = ['lecture', 'lecturer', 'subject', 'news'];

/** Every active lecture, for client-side search (one request, cached 10 min). */
function useAllLectures(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.lectures.all(),
    enabled,
    staleTime: 10 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const res = await apiClient.get('/lectures', { signal });
      return (res.data?.data ?? []) as LectureRow[];
    },
  });
}

/** Sections, so lecture hits can show "Section 2 · Lecture 7" and link to their subject. */
function useAllSections(enabled: boolean) {
  return useQuery({
    queryKey: ['sections', 'all'] as const,
    enabled,
    staleTime: 10 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const res = await apiClient.get('/sections', { signal });
      return (res.data?.data ?? []) as SectionRow[];
    },
  });
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFKD');
}

/** 3 = starts with the query, 2 = a word starts with it, 1 = contains it. */
function matchScore(haystack: string, needle: string): number {
  const text = normalize(haystack);
  if (!needle || !text.includes(needle)) return 0;
  if (text.startsWith(needle)) return 3;
  const wordStart = /[\s:–(-]/;
  for (let index = text.indexOf(needle); index > 0; index = text.indexOf(needle, index + 1)) {
    if (wordStart.test(text[index - 1])) return 2;
  }
  return 1;
}

const byScore = (a: SearchHit, b: SearchHit) => b.score - a.score || a.title.localeCompare(b.title);

/**
 * Client-side search across lectures, lecturers, subjects and news. The data
 * set is small (hundreds of rows), so one cached fetch beats a search endpoint.
 * Returns every hit (grouped in render order) plus per-kind counts for the
 * scope chips; `scope` and `yearOnly` narrow the visible hits.
 */
export function useSearch(
  query: string,
  { enabled = true, scope = 'all', yearOnly = null }: { enabled?: boolean; scope?: SearchScope; yearOnly?: number | null } = {},
) {
  const subjects = useSubjects({ yearLevel: 'all' });
  const lectures = useAllLectures(enabled);
  const sections = useAllSections(enabled);
  const news = useHotNews(30);

  const isLoading = subjects.isLoading || lectures.isLoading || sections.isLoading;

  const all = useMemo<SearchHit[]>(() => {
    const needle = normalize(query.trim());
    if (needle.length < 2) return [];

    const subjectById = new Map<string, SubjectWithStats>((subjects.data ?? []).map((s) => [s.id, s]));
    const sectionById = new Map((sections.data ?? []).map((s) => [s.id, s]));

    // Section numbers and lecture numbers run per subject, in order_index order.
    const sectionNumber = new Map<string, number>();
    const sectionsBySubject = new Map<string, SectionRow[]>();
    for (const section of sections.data ?? []) {
      sectionsBySubject.set(section.subject_id, [...(sectionsBySubject.get(section.subject_id) ?? []), section]);
    }
    const lecturesBySection = new Map<string, LectureRow[]>();
    for (const lecture of lectures.data ?? []) {
      lecturesBySection.set(lecture.section_id, [...(lecturesBySection.get(lecture.section_id) ?? []), lecture]);
    }
    const lectureNumber = new Map<string, number>();
    for (const subjectSections of sectionsBySubject.values()) {
      let n = 0;
      [...subjectSections]
        .sort((a, b) => a.order_index - b.order_index)
        .forEach((section, index) => {
          sectionNumber.set(section.id, index + 1);
          for (const lecture of [...(lecturesBySection.get(section.id) ?? [])].sort((a, b) => a.order_index - b.order_index)) {
            lectureNumber.set(lecture.id, ++n);
          }
        });
    }

    const lectureHits: SearchHit[] = [];
    const lecturers = new Map<string, { count: number; codes: Set<string>; score: number }>();
    for (const lecture of lectures.data ?? []) {
      const section = sectionById.get(lecture.section_id);
      const subject = section ? subjectById.get(section.subject_id) : undefined;
      if (!section || !subject) continue;

      if (lecture.lecturer_name) {
        const lecturerScore = matchScore(lecture.lecturer_name, needle);
        if (lecturerScore > 0) {
          const entry = lecturers.get(lecture.lecturer_name) ?? { count: 0, codes: new Set<string>(), score: lecturerScore };
          entry.count += 1;
          entry.codes.add(subject.code);
          lecturers.set(lecture.lecturer_name, entry);
        }
      }

      const score = matchScore(lecture.title, needle);
      if (score <= 0) continue;
      lectureHits.push({
        kind: 'lecture',
        id: lecture.id,
        href: `/subjects/${subject.id}/lectures/${lecture.id}`,
        title: lecture.title,
        subtitle: [
          subject.code,
          `Section ${sectionNumber.get(section.id) ?? '?'}`,
          `Lecture ${lectureNumber.get(lecture.id) ?? '?'}`,
          lecture.lecturer_name,
        ]
          .filter(Boolean)
          .join(' · '),
        score,
        yearLevel: subject.year_level,
      });
    }

    const lecturerHits: SearchHit[] = [...lecturers.entries()].map(([name, entry]) => ({
      kind: 'lecturer',
      id: name,
      href: `/search?q=${encodeURIComponent(name)}`,
      title: name,
      subtitle: `${entry.count} ${entry.count === 1 ? 'lecture' : 'lectures'} across ${[...entry.codes].slice(0, 3).join(', ')}`,
      score: entry.score,
    }));

    const subjectHits: SearchHit[] = (subjects.data ?? [])
      .map((s) => ({ s, score: Math.max(matchScore(s.name, needle), matchScore(s.code, needle)) }))
      .filter(({ score }) => score > 0)
      .map(({ s, score }) => ({
        kind: 'subject' as const,
        id: s.id,
        href: `/subjects/${s.id}`,
        title: `${s.code} ${s.name}`,
        subtitle: `Year ${s.year_level} · ${s.lectures_count} lectures`,
        score,
        yearLevel: s.year_level,
      }));

    const newsHits: SearchHit[] = (news.data ?? [])
      .map((n: News) => ({ n, score: matchScore(n.title, needle) }))
      .filter(({ score }) => score > 0)
      .map(({ n, score }) => ({
        kind: 'news' as const,
        id: n.id,
        href: `/news/${n.id}`,
        title: n.title,
        subtitle: n.category?.name ?? 'News',
        score,
      }));

    return [
      ...lectureHits.sort(byScore).slice(0, 40),
      ...lecturerHits.sort(byScore).slice(0, 5),
      ...subjectHits.sort(byScore).slice(0, 8),
      ...newsHits.sort(byScore).slice(0, 5),
    ];
  }, [query, subjects.data, lectures.data, sections.data, news.data]);

  const counts = useMemo(() => {
    const visibleByYear = all.filter((hit) => !yearOnly || hit.yearLevel === undefined || hit.yearLevel === yearOnly);
    return {
      lecture: visibleByYear.filter((hit) => hit.kind === 'lecture').length,
      subject: visibleByYear.filter((hit) => hit.kind === 'subject').length,
      lecturer: visibleByYear.filter((hit) => hit.kind === 'lecturer').length,
    };
  }, [all, yearOnly]);

  const hits = useMemo(() => {
    const filtered = all.filter((hit) => {
      if (yearOnly && hit.yearLevel !== undefined && hit.yearLevel !== yearOnly) return false;
      if (yearOnly && hit.kind === 'news') return false;
      return scope === 'all' || hit.kind === scope;
    });
    // In "All", keep each group short so every kind is visible at once.
    if (scope !== 'all') return filtered;
    const perKind: Record<SearchKind, number> = { lecture: 8, lecturer: 3, subject: 4, news: 3 };
    const taken: Record<SearchKind, number> = { lecture: 0, lecturer: 0, subject: 0, news: 0 };
    return filtered.filter((hit) => taken[hit.kind]++ < perKind[hit.kind]);
  }, [all, scope, yearOnly]);

  return { hits, counts, isLoading };
}
