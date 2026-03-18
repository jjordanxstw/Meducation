/**
 * Sections Service
 * Handles section business logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class SectionsService {
  private readonly logger = new Logger(SectionsService.name);
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

  private mapSectionWriteError(error: { code?: string; message?: string; details?: string | null; hint?: string | null }): never {
    if (error.code === '23505') {
      const signature = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

      if (signature.includes('idx_sections_subject_name_unique_ci') || signature.includes('(subject_id, lower(name))') || signature.includes('(subject_id, name)')) {
        throw new AppException(ErrorCode.SECTION_NAME_DUPLICATE, { field: 'name' });
      }

      throw new AppException(ErrorCode.RESOURCE_CONFLICT, { resource: 'section' }, 'Duplicate section data');
    }

    throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'section' });
  }

  async findAll(subjectId?: string, isActive: boolean = true, search?: string) {
    let query = this.supabaseAdmin.from('sections').select('*');

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    if (isActive) {
      query = query.eq('is_active', true);
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term}`);
    }

    const { data, error } = await query.order('order_index');

    if (error) {
      this.logger.warn(`Failed to fetch sections (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'section' }, 'Failed to fetch sections');
    }

    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('sections')
      .select(`*, lectures:lectures(*, resources:resources(*))`)
      .eq('id', id)
      .single();

    if (error) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'section', id }, 'Section not found');
    }

    return data;
  }

  async create(data: any) {
    const { data: result, error } = await this.supabaseAdmin
      .from('sections')
      .insert(data)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to create section (code=${error.code ?? 'unknown'})`);
      this.mapSectionWriteError(error);
    }

    return result;
  }

  async update(id: string, data: any) {
    const { data: oldData } = await this.supabaseAdmin
      .from('sections')
      .select('*')
      .eq('id', id)
      .single();

    const { data: result, error } = await this.supabaseAdmin
      .from('sections')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to update section (code=${error.code ?? 'unknown'})`);
      this.mapSectionWriteError(error);
    }

    return { oldData, newData: result };
  }

  async delete(id: string) {
    const { data: oldData } = await this.supabaseAdmin
      .from('sections')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await this.supabaseAdmin.from('sections').delete().eq('id', id);

    if (error) {
      this.logger.warn(`Failed to delete section (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'section', id }, 'Failed to delete section');
    }

    return { oldData };
  }

  async reorder(items: Array<{ id: string; order_index: number }>) {
    for (const item of items) {
      const { error } = await this.supabaseAdmin
        .from('sections')
        .update({ order_index: item.order_index })
        .eq('id', item.id);

      if (error) {
        this.logger.warn(`Failed to reorder sections (code=${error.code ?? 'unknown'})`);
        throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'section_order' }, 'Failed to reorder sections');
      }
    }

    return { message: 'Sections reordered successfully' };
  }
}
