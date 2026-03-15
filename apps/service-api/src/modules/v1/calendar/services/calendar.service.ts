/**
 * Calendar Service
 * Handles calendar event business logic
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

  private parseIsoDate(value: unknown, field: string): Date {
    if (typeof value !== 'string' || !value.trim()) {
      throw new AppException(
        ErrorCode.CALENDAR_TIME_RANGE_INVALID,
        { field, reason: 'missing_or_invalid' },
        'Calendar event time range is invalid',
      );
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppException(
        ErrorCode.CALENDAR_TIME_RANGE_INVALID,
        { field, reason: 'invalid_date' },
        'Calendar event time range is invalid',
      );
    }

    return parsed;
  }

  private async ensureValidEventTimeWindow(
    payload: Record<string, unknown>,
    options?: { excludeId?: string },
  ): Promise<void> {
    const start = this.parseIsoDate(payload.start_time, 'start_time');
    const end = this.parseIsoDate(payload.end_time, 'end_time');

    if (end <= start) {
      throw new AppException(
        ErrorCode.CALENDAR_TIME_RANGE_INVALID,
        { field: 'end_time', reason: 'must_be_after_start_time' },
        'Calendar event time range is invalid',
      );
    }

    const overlapQuery = this.supabaseAdmin
      .from('calendar_events')
      .select('id')
      .lt('start_time', end.toISOString())
      .gt('end_time', start.toISOString())
      .limit(1);

    if (options?.excludeId) {
      overlapQuery.neq('id', options.excludeId);
    }

    const subjectId = payload.subject_id as string | null | undefined;
    if (subjectId === null || subjectId === undefined || subjectId === '') {
      overlapQuery.is('subject_id', null);
    } else {
      overlapQuery.eq('subject_id', subjectId);
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

    if (overlapRows && overlapRows.length > 0) {
      throw new AppException(
        ErrorCode.CALENDAR_EVENT_TIME_CONFLICT,
        { conflictingEventId: overlapRows[0].id },
      );
    }
  }

  async findAll(startDate?: string, endDate?: string, type?: string, subjectId?: string) {
    let query = this.supabaseAdmin
      .from('calendar_events')
      .select('*, subjects:subject_id(name, code)');

    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('end_time', endDate);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data, error } = await query.order('start_time');

    if (error) {
      this.logger.warn(`Failed to fetch calendar events (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'calendar_event' }, 'Failed to fetch calendar events');
    }

    return data;
  }

  async getByMonth(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const { data, error } = await this.supabaseAdmin
      .from('calendar_events')
      .select('*, subjects:subject_id(name, code)')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time');

    if (error) {
      this.logger.warn(`Failed to fetch calendar events (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'calendar_event' }, 'Failed to fetch calendar events');
    }

    return data;
  }

  async getUpcoming(limit: number = 10) {
    const now = new Date().toISOString();

    const { data, error } = await this.supabaseAdmin
      .from('calendar_events')
      .select('*, subjects:subject_id(name, code)')
      .gte('start_time', now)
      .order('start_time')
      .limit(limit);

    if (error) {
      this.logger.warn(`Failed to fetch upcoming events (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'calendar_event' }, 'Failed to fetch upcoming events');
    }

    return data;
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

    return data;
  }

  async create(data: any, createdBy: string) {
    const eventData: Record<string, unknown> = { ...(data || {}) };
    delete eventData.created_by;

    if (createdBy) {
      eventData.created_by_admin = createdBy;
    }

    await this.ensureValidEventTimeWindow(eventData);

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
    await this.ensureValidEventTimeWindow(mergedPayload, { excludeId: id });

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
