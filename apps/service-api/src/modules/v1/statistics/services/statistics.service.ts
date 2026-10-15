/**
 * Statistics Service
 * Builds aggregate dashboard payload in a single API call
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@medical-portal/shared';
import { getSupabaseAdmin } from '../../../../common/supabase/supabase-admin';
import { normalizeLink } from '../../../../common/utils/normalize-link';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

export interface CountPair {
  total: number;
  active: number;
}

export type ActivityGranularity = 'day' | 'week' | 'month';

export interface ActivityBucket {
  bucket: string; // ISO date (YYYY-MM-DD) of the bucket start
  newProfiles: number;
  newLectures: number;
  newAuditEvents: number;
}

export interface ActivityResponse {
  granularity: ActivityGranularity;
  from: string;
  to: string;
  buckets: ActivityBucket[];
  totals: {
    newProfiles: number;
    newLectures: number;
    newAuditEvents: number;
  };
}

const MIN_RANGE_DAYS = 1;
const MAX_RANGE_DAYS = 366;
/** PostgREST default max rows per response. */
const STATS_PAGE_SIZE = 1000;
/** Hard stop so a runaway table cannot turn one dashboard load into hundreds of requests. */
const STATS_MAX_ROWS = 50_000;
type TableName = keyof Database['public']['Tables'];
/** Rows returned per "Needs attention" list (the full count is always included). */
const ATTENTION_LIST_LIMIT = 8;

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);
  private readonly supabaseAdmin: SupabaseClient<Database>;

  constructor(private readonly configService: ConfigService) {
    this.supabaseAdmin = getSupabaseAdmin(this.configService);
  }

  private async countTable(table: TableName, activeField?: 'is_active'): Promise<CountPair> {
    const [{ count: totalCount, error: totalError }, { count: activeCount, error: activeError }] = await Promise.all([
      this.supabaseAdmin.from(table).select('*', { count: 'exact', head: true }),
      activeField
        ? this.supabaseAdmin.from(table).select('*', { count: 'exact', head: true }).eq(activeField, true)
        : this.supabaseAdmin.from(table).select('*', { count: 'exact', head: true }),
    ]);

    if (totalError || activeError) {
      this.logger.warn(`Failed counting ${table} (total=${totalError?.code ?? 'ok'}, active=${activeError?.code ?? 'ok'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: `${table}_stats` });
    }

    return {
      total: totalCount ?? 0,
      active: activeCount ?? 0,
    };
  }

  /**
   * PostgREST caps every response at 1,000 rows, which silently truncated the
   * dashboard counts once a range held more rows than that (D2). Pages through
   * `.range()` until a short page comes back.
   */
  private async fetchAllRows<T>(
    buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { code?: string } | null }>,
  ): Promise<{ data: T[]; error: { code?: string } | null }> {
    const rows: T[] = [];
    for (let from = 0; from < STATS_MAX_ROWS; from += STATS_PAGE_SIZE) {
      const { data, error } = await buildQuery(from, from + STATS_PAGE_SIZE - 1);
      if (error) {
        return { data: rows, error };
      }
      rows.push(...(data ?? []));
      if ((data?.length ?? 0) < STATS_PAGE_SIZE) {
        break;
      }
    }
    return { data: rows, error: null };
  }

  /**
   * "Needs attention": active content that students will trip over. Each list
   * is capped for display; `count` is the full number.
   */
  async getNeedsAttention() {
    const [subjects, sections, lectures, resources, drafts, events] = await Promise.all([
      this.fetchAllRows<{ id: string; code: string; name: string; year_level: number; is_active: boolean }>((from, to) =>
        this.supabaseAdmin.from('subjects').select('id, code, name, year_level, is_active').order('id').range(from, to),
      ),
      this.fetchAllRows<{ id: string; subject_id: string; name: string; is_active: boolean }>((from, to) =>
        this.supabaseAdmin.from('sections').select('id, subject_id, name, is_active').order('id').range(from, to),
      ),
      this.fetchAllRows<{
        id: string;
        section_id: string;
        title: string;
        lecture_date: string | null;
        lecturer_name: string | null;
        is_active: boolean;
      }>((from, to) =>
        this.supabaseAdmin
          .from('lectures')
          .select('id, section_id, title, lecture_date, lecturer_name, is_active')
          .order('id')
          .range(from, to),
      ),
      this.fetchAllRows<{ lecture_id: string; type: string; url: string; is_active: boolean }>((from, to) =>
        this.supabaseAdmin.from('resources').select('lecture_id, type, url, is_active').order('id').range(from, to),
      ),
      this.supabaseAdmin.from('news').select('id', { count: 'exact', head: true }).eq('is_published', false),
      this.fetchAllRows<{ start_date: string; end_date: string | null; subject_id: string | null }>((from, to) =>
        this.supabaseAdmin.from('calendar_events').select('start_date, end_date, subject_id').order('id').range(from, to),
      ),
    ]);

    for (const result of [subjects, sections, lectures, resources, events]) {
      if (result.error) {
        this.logger.warn(`Failed to build attention list (code=${result.error.code ?? 'unknown'})`);
        throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'attention_stats' });
      }
    }

    const subjectById = new Map(subjects.data.map((subject) => [subject.id, subject]));
    const activeSections = sections.data.filter((section) => section.is_active && subjectById.get(section.subject_id)?.is_active);
    const sectionById = new Map(activeSections.map((section) => [section.id, section]));
    const activeLectures = lectures.data.filter((lecture) => lecture.is_active && sectionById.has(lecture.section_id));

    const videoTypes = new Set(['youtube', 'gdrive_video']);
    const resourceCount = new Map<string, number>();
    const hasVideo = new Set<string>();
    for (const resource of resources.data) {
      if (!resource.is_active) continue;
      resourceCount.set(resource.lecture_id, (resourceCount.get(resource.lecture_id) ?? 0) + 1);
      if (videoTypes.has(resource.type)) hasVideo.add(resource.lecture_id);
    }

    const lectureRef = (lecture: (typeof activeLectures)[number]) => {
      const section = sectionById.get(lecture.section_id)!;
      const subject = subjectById.get(section.subject_id)!;
      return { id: lecture.id, title: lecture.title, subjectId: subject.id, subjectCode: subject.code, sectionName: section.name };
    };
    const lecturesPerSection = new Map<string, number>();
    for (const lecture of activeLectures) {
      lecturesPerSection.set(lecture.section_id, (lecturesPerSection.get(lecture.section_id) ?? 0) + 1);
    }
    const lecturesPerSubject = new Map<string, number>();
    for (const section of activeSections) {
      lecturesPerSubject.set(section.subject_id, (lecturesPerSubject.get(section.subject_id) ?? 0) + (lecturesPerSection.get(section.id) ?? 0));
    }

    const take = <T,>(items: T[]) => ({ count: items.length, items: items.slice(0, ATTENTION_LIST_LIMIT) });

    // The same link on two lectures of one subject is almost always a copy-paste
    // slip (reusing a recording across subjects can be deliberate).
    const lectureById = new Map(activeLectures.map((lecture) => [lecture.id, lecture]));
    const lecturesByUrl = new Map<string, Set<string>>();
    for (const resource of resources.data) {
      const lecture = lectureById.get(resource.lecture_id);
      // Only recordings: a shared reading list or handout is often deliberate.
      if (!resource.is_active || !lecture || !videoTypes.has(resource.type)) continue;
      const subjectId = sectionById.get(lecture.section_id)!.subject_id;
      const key = `${subjectId}|${normalizeLink(resource.url)}`;
      lecturesByUrl.set(key, (lecturesByUrl.get(key) ?? new Set()).add(resource.lecture_id));
    }
    const duplicateLinks = [...lecturesByUrl.entries()]
      .filter(([, ids]) => ids.size > 1)
      .map(([key, ids]) => ({ url: key.split('|')[1], lectures: [...ids].map((id) => lectureRef(lectureById.get(id)!)) }));

    // A year whose students would see an empty "Coming up": no event tied to one
    // of its subjects (or to everyone) ends today or later.
    const today = new Date().toISOString().slice(0, 10);
    const years = [...new Set(subjects.data.filter((subject) => subject.is_active).map((subject) => subject.year_level))].sort();
    const lastEventByYear = new Map<number, string>();
    for (const event of events.data) {
      const end = event.end_date ?? event.start_date;
      const subject = event.subject_id ? subjectById.get(event.subject_id) : null;
      const targets = event.subject_id ? (subject ? [subject.year_level] : []) : years;
      for (const year of targets) {
        if ((lastEventByYear.get(year) ?? '') < end) lastEventByYear.set(year, end);
      }
    }
    const yearsWithoutUpcomingEvents = years
      .filter((year) => (lastEventByYear.get(year) ?? '') < today)
      .map((year) => ({ yearLevel: year, lastEventDate: lastEventByYear.get(year) ?? null }));

    return {
      lecturesWithoutFiles: take(activeLectures.filter((lecture) => !resourceCount.has(lecture.id)).map(lectureRef)),
      lecturesWithoutVideo: take(
        activeLectures.filter((lecture) => resourceCount.has(lecture.id) && !hasVideo.has(lecture.id)).map(lectureRef),
      ),
      lecturesMissingDetails: take(
        activeLectures.filter((lecture) => !lecture.lecture_date || !lecture.lecturer_name).map(lectureRef),
      ),
      emptySections: take(
        activeSections
          .filter((section) => !lecturesPerSection.has(section.id))
          .map((section) => {
            const subject = subjectById.get(section.subject_id)!;
            return { id: section.id, name: section.name, subjectId: subject.id, subjectCode: subject.code };
          }),
      ),
      emptySubjects: take(
        subjects.data
          .filter((subject) => subject.is_active && !lecturesPerSubject.get(subject.id))
          .map((subject) => ({ id: subject.id, code: subject.code, name: subject.name })),
      ),
      hiddenSubjects: take(
        subjects.data.filter((subject) => !subject.is_active).map((subject) => ({ id: subject.id, code: subject.code, name: subject.name })),
      ),
      duplicateLinks: take(duplicateLinks),
      hiddenSections: take(
        sections.data
          .filter((section) => !section.is_active && subjectById.get(section.subject_id)?.is_active)
          .map((section) => {
            const subject = subjectById.get(section.subject_id)!;
            return { id: section.id, name: section.name, subjectId: subject.id, subjectCode: subject.code };
          }),
      ),
      yearsWithoutUpcomingEvents: take(yearsWithoutUpcomingEvents),
      unpublishedNews: { count: drafts.count ?? 0 },
    };
  }

  /**
   * Subjects list with content health (admin Subjects & lectures): counts,
   * lectures with nothing attached, and the latest edit anywhere in the tree.
   */
  async getSubjectsHealth() {
    const [subjects, sections, lectures, resources] = await Promise.all([
      this.fetchAllRows<{ id: string; code: string; name: string; year_level: number; is_active: boolean; order_index: number; updated_at: string; thumbnail_url: string | null }>(
        (from, to) =>
          this.supabaseAdmin
            .from('subjects')
            .select('id, code, name, year_level, is_active, order_index, updated_at, thumbnail_url')
            .order('id')
            .range(from, to),
      ),
      this.fetchAllRows<{ id: string; subject_id: string; is_active: boolean; updated_at: string }>((from, to) =>
        this.supabaseAdmin.from('sections').select('id, subject_id, is_active, updated_at').order('id').range(from, to),
      ),
      this.fetchAllRows<{ id: string; section_id: string; is_active: boolean; updated_at: string }>((from, to) =>
        this.supabaseAdmin.from('lectures').select('id, section_id, is_active, updated_at').order('id').range(from, to),
      ),
      this.fetchAllRows<{ lecture_id: string; is_active: boolean; updated_at: string }>((from, to) =>
        this.supabaseAdmin.from('resources').select('lecture_id, is_active, updated_at').order('id').range(from, to),
      ),
    ]);
    for (const result of [subjects, sections, lectures, resources]) {
      if (result.error) {
        this.logger.warn(`Failed to build subject health (code=${result.error.code ?? 'unknown'})`);
        throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'subject_health' });
      }
    }

    const subjectOfSection = new Map(sections.data.map((section) => [section.id, section.subject_id]));
    const subjectOfLecture = new Map(lectures.data.map((lecture) => [lecture.id, subjectOfSection.get(lecture.section_id)]));
    const withFiles = new Set(resources.data.filter((resource) => resource.is_active).map((resource) => resource.lecture_id));

    const stats = new Map(subjects.data.map((subject) => [subject.id, { sections: 0, lectures: 0, emptyLectures: 0, updated: subject.updated_at }]));
    const bump = (subjectId: string | undefined, updatedAt: string) => {
      const entry = subjectId ? stats.get(subjectId) : undefined;
      if (entry && updatedAt > entry.updated) entry.updated = updatedAt;
      return entry;
    };
    for (const section of sections.data) {
      const entry = bump(section.subject_id, section.updated_at);
      if (entry && section.is_active) entry.sections += 1;
    }
    for (const lecture of lectures.data) {
      const entry = bump(subjectOfSection.get(lecture.section_id), lecture.updated_at);
      if (!entry || !lecture.is_active) continue;
      entry.lectures += 1;
      if (!withFiles.has(lecture.id)) entry.emptyLectures += 1;
    }
    for (const resource of resources.data) bump(subjectOfLecture.get(resource.lecture_id), resource.updated_at);

    return subjects.data
      .map((subject) => {
        const entry = stats.get(subject.id)!;
        return {
          ...subject,
          sections_count: entry.sections,
          lectures_count: entry.lectures,
          empty_lectures_count: entry.emptyLectures,
          content_updated_at: entry.updated,
        };
      })
      .sort((a, b) => a.year_level - b.year_level || a.order_index - b.order_index);
  }

  /** Dashboard header + KPI cards + "Lectures added per month" (last 6 months). */
  async getDashboardSummary() {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const today = now.toISOString().slice(0, 10);

    const [subjects, lectures, students, recentLectures, exam, audit, studentsByYear] = await Promise.all([
      this.countTable('subjects', 'is_active'),
      this.countTable('lectures', 'is_active'),
      this.supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      this.fetchAllRows<{ created_at: string }>((from, to) =>
        this.supabaseAdmin
          .from('lectures')
          .select('created_at')
          .gte('created_at', sixMonthsAgo.toISOString())
          .order('created_at')
          .range(from, to),
      ),
      this.supabaseAdmin
        .from('calendar_events')
        .select('id, title, start_date, subject:subjects(code, year_level)')
        .eq('type', 'exam')
        .gte('start_date', today)
        .order('start_date')
        .limit(1),
      this.supabaseAdmin
        .from('audit_logs')
        .select('id, action, table_name, record_id, user_email, new_data, old_data, created_at')
        .order('created_at', { ascending: false })
        .limit(6),
      this.getStudentsByYear(),
    ]);

    if (students.error || recentLectures.error || exam.error || audit.error) {
      this.logger.warn('Failed to build dashboard summary');
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'dashboard_summary' });
    }

    const perMonth = Array.from({ length: 6 }, (_, i) => {
      const start = new Date(Date.UTC(sixMonthsAgo.getUTCFullYear(), sixMonthsAgo.getUTCMonth() + i, 1));
      return { month: start.toISOString().slice(0, 7), count: 0 };
    });
    for (const lecture of recentLectures.data) {
      const bucket = perMonth.find((entry) => entry.month === lecture.created_at.slice(0, 7));
      if (bucket) bucket.count += 1;
    }
    const thisMonth = recentLectures.data.filter((lecture) => lecture.created_at >= monthStart.toISOString()).length;
    const nextExam = exam.data?.[0] ?? null;

    // A readable name for each change ("CVS 201", a lecture title …). Tree saves
    // only log counts, so subject codes are looked up.
    const subjectIds = [...new Set((audit.data ?? []).filter((row) => row.table_name === 'subjects' && row.record_id).map((row) => row.record_id!))];
    const { data: subjectCodes } = subjectIds.length
      ? await this.supabaseAdmin.from('subjects').select('id, code').in('id', subjectIds)
      : { data: [] as Array<{ id: string; code: string }> };
    const codeById = new Map((subjectCodes ?? []).map((row) => [row.id, row.code]));
    const nameOf = (data: unknown) => {
      const row = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
      const value = row.title ?? row.name ?? row.code ?? row.label;
      return typeof value === 'string' ? value : null;
    };
    const recentChanges = (audit.data ?? []).map(({ old_data, new_data, ...row }) => ({
      ...row,
      record_label: nameOf(new_data) ?? nameOf(old_data) ?? (row.record_id ? codeById.get(row.record_id) ?? null : null),
      is_tree_save: row.table_name === 'subjects' && row.action === 'UPDATE' && !nameOf(new_data),
    }));
    const years = studentsByYear.filter((entry) => entry.count > 0).map((entry) => entry.yearLevel);

    return {
      subjects: { total: subjects.total, live: subjects.active, hidden: subjects.total - subjects.active },
      lectures: { total: lectures.total, thisMonth },
      students: { total: students.count ?? 0, minYear: years.length ? Math.min(...years) : null, maxYear: years.length ? Math.max(...years) : null },
      nextExam,
      lecturesPerMonth: perMonth,
      recentChanges,
    };
  }

  private async getStudentsByYear(): Promise<Array<{ yearLevel: number; count: number }>> {
    const { data, error } = await this.fetchAllRows<{ year_level: number | null; role: string }>((from, to) =>
      this.supabaseAdmin
        .from('profiles')
        .select('year_level, role')
        .eq('role', 'student')
        .order('id')
        .range(from, to),
    );

    if (error) {
      this.logger.warn(`Failed to fetch student distribution (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'profile_stats' });
    }

    const buckets = new Map<number, number>();
    for (const row of data ?? []) {
      const year = typeof row.year_level === 'number' ? row.year_level : 0;
      if (year <= 0) {
        continue;
      }
      buckets.set(year, (buckets.get(year) ?? 0) + 1);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([yearLevel, count]) => ({ yearLevel, count }));
  }

  private async getRecentAuditLogs() {
    const primary = await this.supabaseAdmin
      .from('audit_logs')
      .select('id, action, table_name, record_id, user_email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!primary.error) {
      return primary;
    }

    if (primary.error.code !== '42703') {
      return primary;
    }

    this.logger.warn('audit_logs.user_email not found, using compatibility query without user_email');

    const fallback = await this.supabaseAdmin
      .from('audit_logs')
      .select('id, action, table_name, record_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (fallback.error) {
      return fallback;
    }

    return {
      data: (fallback.data ?? []).map((row: Record<string, unknown>) => ({
        ...row,
        user_email: null,
      })),
      error: null,
    };
  }

  async getDashboardOverview() {
    const [subjects, sections, lectures, resources, profiles, calendarEvents, studentsByYear, upcomingEventsResult, recentAuditResult] = await Promise.all([
      this.countTable('subjects', 'is_active'),
      this.countTable('sections', 'is_active'),
      this.countTable('lectures', 'is_active'),
      this.countTable('resources', 'is_active'),
      this.countTable('profiles'),
      this.countTable('calendar_events'),
      this.getStudentsByYear(),
      this.supabaseAdmin
        .from('calendar_events')
        .select('id, title, type, start_date, end_date, location, subject_id')
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(8),
      this.getRecentAuditLogs(),
    ]);

    if (upcomingEventsResult.error) {
      this.logger.warn(`Failed to fetch upcoming events (code=${upcomingEventsResult.error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'calendar_event_stats' });
    }

    if (recentAuditResult.error) {
      this.logger.warn(`Failed to fetch recent audits (code=${recentAuditResult.error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'audit_log_stats' });
    }

    return {
      kpis: {
        subjects,
        sections,
        lectures,
        resources,
        profiles,
        calendarEvents,
      },
      studentsByYear,
      upcomingEvents: upcomingEventsResult.data ?? [],
      recentAuditLogs: recentAuditResult.data ?? [],
    };
  }

  /**
   * Returns activity time-series data for the admin dashboard.
   * Buckets new profile creations, lecture creations, and audit events by
   * the requested granularity within the requested ISO date range.
   */
  async getActivityOverTime(params: {
    from?: string;
    to?: string;
    granularity?: ActivityGranularity;
  }): Promise<ActivityResponse> {
    const granularity: ActivityGranularity = params.granularity ?? 'day';

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const defaultFrom = new Date(today);
    defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 29);

    const fromDate = parseIsoDate(params.from) ?? defaultFrom;
    const toDate = parseIsoDate(params.to) ?? today;

    if (toDate.getTime() < fromDate.getTime()) {
      throw new AppException(
        ErrorCode.VALIDATION_FAILED,
        { field: 'to', reason: 'must be after from' },
        'Invalid date range: "to" must be on or after "from"',
      );
    }

    const rangeDays = Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;
    if (rangeDays < MIN_RANGE_DAYS || rangeDays > MAX_RANGE_DAYS) {
      throw new AppException(
        ErrorCode.VALIDATION_FAILED,
        { field: 'range', reason: `must be between ${MIN_RANGE_DAYS} and ${MAX_RANGE_DAYS} days` },
        `Date range must be between ${MIN_RANGE_DAYS} and ${MAX_RANGE_DAYS} days`,
      );
    }

    const fromIso = fromDate.toISOString();
    const toExclusive = new Date(toDate);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
    const toIso = toExclusive.toISOString();

    const createdAtInRange = (table: 'profiles' | 'lectures' | 'audit_logs') =>
      this.fetchAllRows<{ created_at: string | null }>((from, to) =>
        this.supabaseAdmin
          .from(table)
          .select('created_at')
          .gte('created_at', fromIso)
          .lt('created_at', toIso)
          .order('created_at')
          .range(from, to),
      );

    const [profilesResult, lecturesResult, auditResult] = await Promise.all([
      createdAtInRange('profiles'),
      createdAtInRange('lectures'),
      createdAtInRange('audit_logs'),
    ]);

    if (profilesResult.error || lecturesResult.error || auditResult.error) {
      this.logger.warn(
        `Failed to fetch activity series (profiles=${profilesResult.error?.code ?? 'ok'}, ` +
          `lectures=${lecturesResult.error?.code ?? 'ok'}, audit=${auditResult.error?.code ?? 'ok'})`,
      );
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'activity_stats' });
    }

    const buckets = buildBucketSkeleton(fromDate, toDate, granularity);

    const accumulate = (
      rows: Array<{ created_at?: string | null }> | null,
      field: keyof ActivityBucket,
    ) => {
      for (const row of rows ?? []) {
        if (!row?.created_at) {
          continue;
        }

        const ts = new Date(row.created_at);
        if (Number.isNaN(ts.getTime())) {
          continue;
        }

        const key = bucketKey(ts, granularity);
        const bucket = buckets.get(key);
        if (bucket) {
          (bucket[field] as number) += 1;
        }
      }
    };

    accumulate(profilesResult.data, 'newProfiles');
    accumulate(lecturesResult.data, 'newLectures');
    accumulate(auditResult.data, 'newAuditEvents');

    const orderedBuckets = Array.from(buckets.values()).sort((a, b) => a.bucket.localeCompare(b.bucket));

    const totals = orderedBuckets.reduce(
      (acc, b) => {
        acc.newProfiles += b.newProfiles;
        acc.newLectures += b.newLectures;
        acc.newAuditEvents += b.newAuditEvents;
        return acc;
      },
      { newProfiles: 0, newLectures: 0, newAuditEvents: 0 },
    );

    return {
      granularity,
      from: toIsoDate(fromDate),
      to: toIsoDate(toDate),
      buckets: orderedBuckets,
      totals,
    };
  }
}

function parseIsoDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  // Accept either YYYY-MM-DD or full ISO timestamps. We always normalize to UTC midnight
  // so that bucket boundaries are stable regardless of the caller's timezone.
  const trimmed = value.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00.000Z` : trimmed;
  const parsed = new Date(dateOnly);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setUTCHours(0, 0, 0, 0);
  return parsed;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function bucketKey(date: Date, granularity: ActivityGranularity): string {
  const start = bucketStart(date, granularity);
  return toIsoDate(start);
}

function bucketStart(date: Date, granularity: ActivityGranularity): Date {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);

  if (granularity === 'day') {
    return result;
  }

  if (granularity === 'week') {
    // Anchor weeks to Monday (ISO week start)
    const day = result.getUTCDay();
    const offset = (day + 6) % 7; // Mon=0, Tue=1 ... Sun=6
    result.setUTCDate(result.getUTCDate() - offset);
    return result;
  }

  // month
  result.setUTCDate(1);
  return result;
}

function buildBucketSkeleton(
  from: Date,
  to: Date,
  granularity: ActivityGranularity,
): Map<string, ActivityBucket> {
  const map = new Map<string, ActivityBucket>();

  const cursor = bucketStart(from, granularity);
  const limit = bucketStart(to, granularity);

  // Safety cap to prevent runaway loops on bad inputs.
  let iterations = 0;
  while (cursor.getTime() <= limit.getTime() && iterations < 1024) {
    const key = toIsoDate(cursor);
    map.set(key, {
      bucket: key,
      newProfiles: 0,
      newLectures: 0,
      newAuditEvents: 0,
    });

    if (granularity === 'day') {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    } else if (granularity === 'week') {
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    } else {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    iterations += 1;
  }

  return map;
}
