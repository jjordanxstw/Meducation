/**
 * Event Types Service
 * Admin CRUD for the calendar event_types table. Renaming a type cascades to
 * every calendar event via the FK (ON UPDATE CASCADE); deleting a type that
 * still has events is blocked (ON DELETE RESTRICT + an explicit pre-check for a
 * friendly message).
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class EventTypesService {
  private readonly logger = new Logger(EventTypesService.name);
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

  private mapWriteError(error: { code?: string; message?: string }): never {
    if (error.code === '23505') {
      throw new AppException(ErrorCode.CALENDAR_EVENT_TYPE_NAME_DUPLICATE, { field: 'name' });
    }
    if (error.code === '23503') {
      throw new AppException(ErrorCode.CALENDAR_EVENT_TYPE_IN_USE, { resource: 'event_type' });
    }
    throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'event_type' });
  }

  async findAll() {
    const { data, error } = await this.supabaseAdmin
      .from('event_types')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      this.logger.warn(`Failed to fetch event types (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'event_type' }, 'Failed to fetch event types');
    }

    return data ?? [];
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('event_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'event_type', id }, 'Event type not found');
    }

    return data;
  }

  async create(payload: { name?: string; color?: string; sort_order?: number }) {
    const insert: Record<string, unknown> = { name: (payload.name ?? '').trim() };
    if (payload.color) insert.color = payload.color;
    if (typeof payload.sort_order === 'number') insert.sort_order = payload.sort_order;

    const { data, error } = await this.supabaseAdmin
      .from('event_types')
      .insert(insert)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to create event type (code=${error.code ?? 'unknown'})`);
      this.mapWriteError(error);
    }

    return data;
  }

  async update(id: string, payload: { name?: string; color?: string; sort_order?: number }) {
    const { data: oldData } = await this.supabaseAdmin
      .from('event_types')
      .select('*')
      .eq('id', id)
      .single();

    if (!oldData) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'event_type', id }, 'Event type not found');
    }

    const patch: Record<string, unknown> = {};
    if (typeof payload.name === 'string') patch.name = payload.name.trim();
    if (typeof payload.color === 'string') patch.color = payload.color;
    if (typeof payload.sort_order === 'number') patch.sort_order = payload.sort_order;

    // Renaming relies on the FK ON UPDATE CASCADE to rewrite every event's type.
    const { data: result, error } = await this.supabaseAdmin
      .from('event_types')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to update event type (code=${error.code ?? 'unknown'})`);
      this.mapWriteError(error);
    }

    return { oldData, newData: result };
  }

  async delete(id: string) {
    const { data: oldData } = await this.supabaseAdmin
      .from('event_types')
      .select('*')
      .eq('id', id)
      .single();

    if (!oldData) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'event_type', id }, 'Event type not found');
    }

    // Friendly pre-check (the FK ON DELETE RESTRICT is the hard guarantee).
    const { count, error: countError } = await this.supabaseAdmin
      .from('calendar_events')
      .select('id', { count: 'exact', head: true })
      .eq('type', oldData.name);

    if (countError) {
      this.logger.warn(`Failed to count events for type (code=${countError.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'event_type', id }, 'Failed to delete event type');
    }

    if ((count ?? 0) > 0) {
      throw new AppException(ErrorCode.CALENDAR_EVENT_TYPE_IN_USE, { resource: 'event_type', id, events: count });
    }

    const { error } = await this.supabaseAdmin.from('event_types').delete().eq('id', id);

    if (error) {
      this.logger.warn(`Failed to delete event type (code=${error.code ?? 'unknown'})`);
      this.mapWriteError(error);
    }

    return { oldData };
  }
}
