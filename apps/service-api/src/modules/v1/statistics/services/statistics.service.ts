/**
 * Statistics Service
 * Builds aggregate dashboard payload in a single API call
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);
  private readonly supabaseAdmin: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  private async countTable(table: string, activeField?: string): Promise<CountPair> {
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

  private async getStudentsByYear(): Promise<Array<{ yearLevel: number; count: number }>> {
    const { data, error } = await this.supabaseAdmin
      .from('profiles')
      .select('year_level, role')
      .eq('role', 'student');

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

    const [profilesResult, lecturesResult, auditResult] = await Promise.all([
      this.supabaseAdmin
        .from('profiles')
        .select('created_at')
        .gte('created_at', fromIso)
        .lt('created_at', toIso),
      this.supabaseAdmin
        .from('lectures')
        .select('created_at')
        .gte('created_at', fromIso)
        .lt('created_at', toIso),
      this.supabaseAdmin
        .from('audit_logs')
        .select('created_at')
        .gte('created_at', fromIso)
        .lt('created_at', toIso),
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
