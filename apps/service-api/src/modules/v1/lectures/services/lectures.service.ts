/**
 * Lectures Service
 * Handles lecture business logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class LecturesService {
  private readonly logger = new Logger(LecturesService.name);
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

  async findAll(sectionId?: string, isActive: boolean = true) {
    let query = this.supabaseAdmin.from('lectures').select('*');

    if (sectionId) {
      query = query.eq('section_id', sectionId);
    }
    if (isActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('order_index');

    if (error) {
      this.logger.warn(`Failed to fetch lectures (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'lecture' }, 'Failed to fetch lectures');
    }

    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('lectures')
      .select(`*, resources:resources(*)`)
      .eq('id', id)
      .single();

    if (error) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'lecture', id }, 'Lecture not found');
    }

    // Sort resources by order_index
    if (data.resources) {
      data.resources.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index);
    }

    return data;
  }

  async create(data: any) {
    const { data: result, error } = await this.supabaseAdmin
      .from('lectures')
      .insert(data)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to create lecture (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'lecture' }, 'Failed to create lecture');
    }

    return result;
  }

  async update(id: string, data: any) {
    const { data: oldData } = await this.supabaseAdmin
      .from('lectures')
      .select('*')
      .eq('id', id)
      .single();

    const { data: result, error } = await this.supabaseAdmin
      .from('lectures')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to update lecture (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'lecture', id }, 'Failed to update lecture');
    }

    return { oldData, newData: result };
  }

  async delete(id: string) {
    const { data: oldData } = await this.supabaseAdmin
      .from('lectures')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await this.supabaseAdmin.from('lectures').delete().eq('id', id);

    if (error) {
      this.logger.warn(`Failed to delete lecture (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'lecture', id }, 'Failed to delete lecture');
    }

    return { oldData };
  }

  async reorder(items: Array<{ id: string; order_index: number }>) {
    for (const item of items) {
      const { error } = await this.supabaseAdmin
        .from('lectures')
        .update({ order_index: item.order_index })
        .eq('id', item.id);

      if (error) {
        this.logger.warn(`Failed to reorder lectures (code=${error.code ?? 'unknown'})`);
        throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'lecture_order' }, 'Failed to reorder lectures');
      }
    }

    return { message: 'Lectures reordered successfully' };
  }
}
