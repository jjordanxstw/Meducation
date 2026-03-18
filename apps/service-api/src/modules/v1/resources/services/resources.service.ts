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

  private validateResourcePayload(payload: any): void {
    if (!payload || payload.url === undefined || payload.url === null) {
      return;
    }

    if (typeof payload.url !== 'string' || payload.url.trim().length === 0) {
      throw new AppException(
        ErrorCode.RESOURCE_URL_INVALID,
        { field: 'url' },
        'Resource URL is invalid',
      );
    }

    try {
      new URL(payload.url);
    } catch {
      throw new AppException(
        ErrorCode.RESOURCE_URL_INVALID,
        { field: 'url', value: payload.url },
        'Resource URL is invalid',
      );
    }
  }

  private mapResourceWriteError(error: { code?: string; message?: string; details?: string | null; hint?: string | null }): never {
    if (error.code === '23505') {
      const signature = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

      if (signature.includes('idx_resources_lecture_label_unique_ci') || signature.includes('(lecture_id, lower(label))') || signature.includes('(lecture_id, label)')) {
        throw new AppException(ErrorCode.RESOURCE_LABEL_DUPLICATE, { field: 'label' });
      }
      if (signature.includes('idx_resources_lecture_url_unique') || signature.includes('(lecture_id, url)')) {
        throw new AppException(ErrorCode.RESOURCE_URL_DUPLICATE, { field: 'url' });
      }

      throw new AppException(ErrorCode.RESOURCE_CONFLICT, { resource: 'resource' }, 'Duplicate resource data');
    }

    throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'resource' });
  }

  async findAll(lectureId?: string, type?: string, isActive: boolean = true, search?: string) {
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
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`label.ilike.${term},url.ilike.${term}`);
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
    this.validateResourcePayload(data);

    const { data: result, error } = await this.supabaseAdmin
      .from('resources')
      .insert(data)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to create resource (code=${error.code ?? 'unknown'})`);
      this.mapResourceWriteError(error);
    }

    return result;
  }

  async bulkCreate(resources: any[]) {
    resources.forEach((item) => this.validateResourcePayload(item));

    const { data, error } = await this.supabaseAdmin
      .from('resources')
      .insert(resources)
      .select();

    if (error) {
      this.logger.warn(`Failed to create resources (code=${error.code ?? 'unknown'})`);
      this.mapResourceWriteError(error);
    }

    return data;
  }

  async update(id: string, data: any) {
    this.validateResourcePayload(data);

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
      this.mapResourceWriteError(error);
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
