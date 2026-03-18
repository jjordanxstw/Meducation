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
        .select('id, title, type, start_time, end_time, location, subject_id')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
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
}
