/**
 * Calendar Service
 * Handles calendar event business logic
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
      this.logger.error('Failed to fetch calendar events', error);
      throw new BadRequestException('Failed to fetch calendar events');
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
      this.logger.error('Failed to fetch calendar events', error);
      throw new BadRequestException('Failed to fetch calendar events');
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
      this.logger.error('Failed to fetch upcoming events', error);
      throw new BadRequestException('Failed to fetch upcoming events');
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
      throw new NotFoundException('Calendar event not found');
    }

    return data;
  }

  async create(data: any, createdBy: string) {
    const eventData = { ...data, created_by: createdBy };

    const { data: result, error } = await this.supabaseAdmin
      .from('calendar_events')
      .insert(eventData)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create calendar event', error);
      throw new BadRequestException('Failed to create calendar event');
    }

    return result;
  }

  async update(id: string, data: any) {
    const { data: oldData } = await this.supabaseAdmin
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();

    const { data: result, error } = await this.supabaseAdmin
      .from('calendar_events')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update calendar event', error);
      throw new BadRequestException('Failed to update calendar event');
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
      this.logger.error('Failed to delete calendar event', error);
      throw new BadRequestException('Failed to delete calendar event');
    }

    return { oldData };
  }
}
