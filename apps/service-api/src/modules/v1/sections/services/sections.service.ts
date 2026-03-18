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

  private requireStringField(payload: any, field: string): string {
    const value = payload?.[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field },
        `Missing required field: ${field}`,
      );
    }

    return value.trim();
  }

  private async assertSubjectExists(subjectId: string): Promise<void> {
    const { error } = await this.supabaseAdmin
      .from('subjects')
      .select('id')
      .eq('id', subjectId)
      .single();

    if (error) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: 'subject_id', value: subjectId },
        'Subject does not exist',
      );
    }
  }

  private mapSectionWriteError(error: { code?: string; message?: string; details?: string | null; hint?: string | null }): never {
    if (error.code === '23503') {
      const signature = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
      if (signature.includes('subject_id')) {
        throw new AppException(
          ErrorCode.VALIDATION_INVALID_INPUT,
          { field: 'subject_id' },
          'Subject does not exist',
        );
      }

      throw new AppException(ErrorCode.VALIDATION_INVALID_INPUT, { resource: 'section' }, 'Invalid foreign key reference');
    }

    if (error.code === '23505') {
      const signature = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

      if (signature.includes('idx_sections_subject_name_unique_ci') || signature.includes('(subject_id, lower(name))') || signature.includes('(subject_id, name)')) {
        throw new AppException(ErrorCode.SECTION_NAME_DUPLICATE, { field: 'name' });
      }

      throw new AppException(ErrorCode.RESOURCE_CONFLICT, { resource: 'section' }, 'Duplicate section data');
    }

    throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'section' });
  }

  private resolveSort(
    sortBy?: string,
    sortOrder?: string,
  ): { field: string; ascending: boolean } {
    const allowed = new Set(['subject_id', 'name', 'order_index', 'is_active', 'created_at', 'updated_at']);
    const field = sortBy && allowed.has(sortBy) ? sortBy : 'order_index';
    const normalizedOrder = (sortOrder || '').toLowerCase();
    const ascending = normalizedOrder === 'asc' || normalizedOrder === 'ascend';
    return { field, ascending };
  }

  async findAll(
    subjectId?: string,
    isActive: boolean = true,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
    page?: number,
    pageSize?: number,
  ) {
    const shouldPaginate = page !== undefined && pageSize !== undefined;
    const safePage = shouldPaginate ? Math.max(1, Number(page) || 1) : 1;
    const safePageSize = shouldPaginate ? Math.min(100, Math.max(1, Number(pageSize) || 15)) : 0;

    let query = this.supabaseAdmin.from('sections').select('*', shouldPaginate ? { count: 'exact' } : undefined);

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

    if (shouldPaginate) {
      const from = (safePage - 1) * safePageSize;
      const to = from + safePageSize - 1;
      query = query.range(from, to);
    }

    const sort = this.resolveSort(sortBy, sortOrder);
    const { data, error, count } = await query.order(sort.field, { ascending: sort.ascending });

    if (error) {
      this.logger.warn(`Failed to fetch sections (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'section' }, 'Failed to fetch sections');
    }

    if (shouldPaginate) {
      const total = count ?? 0;
      return {
        data: data ?? [],
        pagination: {
          page: safePage,
          pageSize: safePageSize,
          total,
          totalPages: Math.ceil(total / safePageSize),
        },
      };
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
    const subjectId = this.requireStringField(data, 'subject_id');
    await this.assertSubjectExists(subjectId);

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
    const subjectId = this.requireStringField(data, 'subject_id');
    await this.assertSubjectExists(subjectId);

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
