/**
 * Resources Service
 * Handles resource business logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);
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

  async findAll(lectureId?: string, type?: string, isActive: boolean = true) {
    let query = this.supabaseAdmin.from('resources').select('*');

    if (lectureId) {
      query = query.eq('lecture_id', lectureId);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (isActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('order_index');

    if (error) {
      this.logger.warn(`Failed to fetch resources (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'resource' }, 'Failed to fetch resources');
    }

    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'resource', id }, 'Resource not found');
    }

    return data;
  }

  async create(data: any) {
    const { data: result, error } = await this.supabaseAdmin
      .from('resources')
      .insert(data)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to create resource (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'resource' }, 'Failed to create resource');
    }

    return result;
  }

  async bulkCreate(resources: any[]) {
    const { data, error } = await this.supabaseAdmin
      .from('resources')
      .insert(resources)
      .select();

    if (error) {
      this.logger.warn(`Failed to create resources (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'resource_bulk' }, 'Failed to create resources');
    }

    return data;
  }

  async update(id: string, data: any) {
    const { data: oldData } = await this.supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    const { data: result, error } = await this.supabaseAdmin
      .from('resources')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to update resource (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'resource', id }, 'Failed to update resource');
    }

    return { oldData, newData: result };
  }

  async delete(id: string) {
    const { data: oldData } = await this.supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await this.supabaseAdmin.from('resources').delete().eq('id', id);

    if (error) {
      this.logger.warn(`Failed to delete resource (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'resource', id }, 'Failed to delete resource');
    }

    return { oldData };
  }

  async reorder(items: Array<{ id: string; order_index: number }>) {
    for (const item of items) {
      const { error } = await this.supabaseAdmin
        .from('resources')
        .update({ order_index: item.order_index })
        .eq('id', item.id);

      if (error) {
        this.logger.warn(`Failed to reorder resources (code=${error.code ?? 'unknown'})`);
        throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'resource_order' }, 'Failed to reorder resources');
      }
    }

    return { message: 'Resources reordered successfully' };
  }
}
