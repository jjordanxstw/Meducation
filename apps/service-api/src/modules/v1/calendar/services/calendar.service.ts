/**
 * Calendar Service
 * Handles calendar event business logic with date-only fields
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }
    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  private parseDateOnly(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new AppException(
        ErrorCode.CALENDAR_DATE_RANGE_INVALID,
        { field, reason: 'missing_or_invalid' },
        'Calendar event date range is invalid',
      );
    }

    // Validate YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value.trim())) {
      throw new AppException(
        ErrorCode.CALENDAR_DATE_RANGE_INVALID,
        { field, reason: 'invalid_date_format' },
        'Calendar event date range is invalid',
      );
    }

    const parsed = new Date(value + 'T00:00:00Z');
    if (Number.isNaN(parsed.getTime())) {
      throw new AppException(
        ErrorCode.CALENDAR_DATE_RANGE_INVALID,
        { field, reason: 'invalid_date' },
        'Calendar event date range is invalid',
      );
    }

    return value.trim();
  }

  private async ensureValidDateRange(
    payload: Record<string, unknown>,
    options?: { excludeId?: string },
  ): Promise<void> {
    const startDate = this.parseDateOnly(payload.start_date, 'start_date');
    const endDate = payload.end_date ? this.parseDateOnly(payload.end_date, 'end_date') : null;

    if (endDate && endDate < startDate) {
      throw new AppException(
        ErrorCode.CALENDAR_DATE_RANGE_INVALID,
        { field: 'end_date', reason: 'must_be_on_or_after_start_date' },
        'Calendar event date range is invalid',
      );
    }

    // Check for overlapping events with the same subject
    const subjectId = payload.subject_id as string | null | undefined;
    if (subjectId === null || subjectId === undefined || subjectId === '') {
      // No overlap check for events without a subject
      return;
    }

    const startTime = (payload.start_time as string | null | undefined) || null;
    const endTime = (payload.end_time as string | null | undefined) || null;

    const overlapQuery = this.supabaseAdmin
      .from('calendar_events')
      .select('id, start_date, end_date, start_time, end_time')
      .eq('subject_id', subjectId);

    // Date overlap if: existing start_date <= our end_date AND existing end_date >= our start_date
    overlapQuery.lte('start_date', endDate ?? startDate);
    // existing end_date >= startDate: handle NULL end_date (treat as same-day)
    overlapQuery.or(`end_date.gte.${startDate},end_date.is.null`);

    if (options?.excludeId) {
      overlapQuery.neq('id', options.excludeId);
    }

    const { data: overlapRows, error: overlapError } = await overlapQuery;

    if (overlapError) {
      this.logger.warn(`Failed to validate calendar overlap (code=${overlapError.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.RESOURCE_OPERATION_FAILED,
        { resource: 'calendar_event_validation' },
        'Failed to validate calendar event',
      );
    }

    const newSingleDay = !endDate || endDate === startDate;

    const conflict = (overlapRows ?? []).find((row) => {
      const rowSingleDay = !row.end_date || row.end_date === row.start_date;
      const sameDay = row.start_date === startDate;
      const bothTimed = !!startTime && !!row.start_time;

      // Two timed events confined to the same single day only conflict when
      // their time ranges actually overlap — otherwise they can coexist.
      if (newSingleDay && rowSingleDay && sameDay && bothTimed) {
        return this.timeRangesOverlap(startTime, endTime, row.start_time, row.end_time);
      }

      // All-day or multi-day involvement keeps the date-level conflict.
      return true;
    });

    if (conflict) {
      throw new AppException(
        ErrorCode.CALENDAR_EVENT_DATE_CONFLICT,
        { conflictingEventId: conflict.id },
      );
    }
  }

  /** Half-open interval overlap on `HH:mm[:ss]` times; missing end = a point. */
  private timeRangesOverlap(
    aStart: string | null,
    aEnd: string | null,
    bStart: string | null,
    bEnd: string | null,
  ): boolean {
    const hm = (t: string | null) => (t ? t.slice(0, 5) : null);
    const aS = hm(aStart);
    const bS = hm(bStart);
    if (!aS || !bS) return true;
    const aE = hm(aEnd) ?? aS;
    const bE = hm(bEnd) ?? bS;
    return aS < bE && bS < aE;
  }

  /** name → color map from the admin-managed event_types table. */
  private async loadTypeColorMap(): Promise<Record<string, string>> {
    const { data } = await this.supabaseAdmin.from('event_types').select('name, color');
    const map: Record<string, string> = {};
    (data ?? []).forEach((row: { name?: string; color?: string }) => {
      if (row.name) map[row.name] = row.color ?? '';
    });
    return map;
  }

  /** Resolve each event's display color: its own override, else its type color. */
  private async withResolvedColors<T extends { type?: string; color?: string | null }>(
    events: T[] | null | undefined,
  ): Promise<T[]> {
    const rows = events ?? [];
    if (rows.length === 0) return rows;
    const map = await this.loadTypeColorMap();
    return rows.map((event) => ({
      ...event,
      color: event.color ?? (event.type ? map[event.type] ?? null : null),
    }));
  }

  private resolveSort(
    sortBy?: string,
    sortOrder?: string,
  ): { field: string; ascending: boolean } {
    const allowed = new Set(['title', 'type', 'start_date', 'end_date', 'created_at', 'updated_at']);
    const field = sortBy && allowed.has(sortBy) ? sortBy : 'start_date';
    const normalizedOrder = (sortOrder || '').toLowerCase();
    const ascending = normalizedOrder === 'asc' || normalizedOrder === 'ascend';
    return { field, ascending };
  }

  async findAll(
    startDate?: string,
    endDate?: string,
    type?: string,
    subjectId?: string,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
    page?: number,
    pageSize?: number,
  ) {
    const shouldPaginate = page !== undefined && pageSize !== undefined;
    const safePage = shouldPaginate ? Math.max(1, Number(page) || 1) : 1;
    const safePageSize = shouldPaginate ? Math.min(100, Math.max(1, Number(pageSize) || 15)) : 0;

    let query = this.supabaseAdmin
      .from('calendar_events')
      .select('*, subjects:subject_id(name, code)', shouldPaginate ? { count: 'exact' } : undefined);

    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('start_date', endDate);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term},location.ilike.${term}`);
    }

    if (shouldPaginate) {
      const from = (safePage - 1) * safePageSize;
      const to = from + safePageSize - 1;
      query = query.range(from, to);
    }

    const sort = this.resolveSort(sortBy, sortOrder);
    const { data, error, count } = await query.order(sort.field, { ascending: sort.ascending });

    if (error) {
      this.logger.warn(`Failed to fetch calendar events (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'calendar_event' }, 'Failed to fetch calendar events');
    }

    if (shouldPaginate) {
      const total = count ?? 0;
      return {
        data: await this.withResolvedColors(data),
        pagination: {
          page: safePage,
          pageSize: safePageSize,
          total,
          totalPages: Math.ceil(total / safePageSize),
        },
      };
    }

    return this.withResolvedColors(data);
  }

  async getByMonth(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await this.supabaseAdmin
      .from('calendar_events')
      .select('*, subjects:subject_id(name, code)')
      .lte('start_date', endDate)
      .or(`end_date.gte.${startDate},end_date.is.null`)
      .order('start_date');

    if (error) {
      this.logger.warn(`Failed to fetch calendar events (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'calendar_event' }, 'Failed to fetch calendar events');
    }

    return this.withResolvedColors(data);
  }

  async getUpcoming(limit: number = 10) {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabaseAdmin
      .from('calendar_events')
      .select('*, subjects:subject_id(name, code)')
      .gte('start_date', today)
      .order('start_date')
      .limit(limit);

    if (error) {
      this.logger.warn(`Failed to fetch upcoming events (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'calendar_event' }, 'Failed to fetch upcoming events');
    }

    return this.withResolvedColors(data);
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('calendar_events')
      .select('*, subjects:subject_id(name, code)')
      .eq('id', id)
      .single();

    if (error) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'calendar_event', id }, 'Calendar event not found');
    }

    const [withColor] = await this.withResolvedColors([data]);
    return withColor ?? data;
  }

  async create(data: any, createdBy: string) {
    const eventData: Record<string, unknown> = { ...(data || {}) };
    delete eventData.created_by;

    if (createdBy) {
      eventData.created_by_admin = createdBy;
    }

    await this.ensureValidDateRange(eventData);

    const { data: result, error } = await this.supabaseAdmin
      .from('calendar_events')
      .insert(eventData)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to create calendar event (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'calendar_event' }, 'Failed to create calendar event');
    }

    return result;
  }

  async update(id: string, data: any) {
    const { data: oldData } = await this.supabaseAdmin
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();

    if (!oldData) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'calendar_event', id }, 'Calendar event not found');
    }

    const mergedPayload = { ...oldData, ...(data || {}) };
    await this.ensureValidDateRange(mergedPayload, { excludeId: id });

    const { data: result, error } = await this.supabaseAdmin
      .from('calendar_events')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to update calendar event (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'calendar_event', id }, 'Failed to update calendar event');
    }

    return { oldData, newData: result };
  }

  async delete(id: string) {
    const { data: oldData } = await this.supabaseAdmin
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await this.supabaseAdmin.from('calendar_events').delete().eq('id', id);

    if (error) {
      this.logger.warn(`Failed to delete calendar event (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'calendar_event', id }, 'Failed to delete calendar event');
    }

    return { oldData };
  }
}
