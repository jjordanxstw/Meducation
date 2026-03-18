/**
 * Subjects Service
 * Handles subject business logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);
  private readonly supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }
    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  private mapSubjectWriteError(error: { code?: string; message?: string; details?: string | null; hint?: string | null }): never {
    if (error.code === '23505') {
      const signature = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

      if (signature.includes('subjects_code_key') || signature.includes('(code)')) {
        throw new AppException(ErrorCode.SUBJECT_CODE_DUPLICATE, { field: 'code' });
      }
      if (signature.includes('idx_subjects_name_unique_ci') || signature.includes('subjects_name_key') || signature.includes('(name)')) {
        throw new AppException(ErrorCode.SUBJECT_NAME_DUPLICATE, { field: 'name' });
      }

      throw new AppException(ErrorCode.RESOURCE_CONFLICT, { resource: 'subject' }, 'Duplicate subject data');
    }

    throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'subject' });
  }

  private resolveSort(
    sortBy?: string,
    sortOrder?: string,
  ): { field: string; ascending: boolean } {
    const allowed = new Set(['code', 'name', 'year_level', 'order_index', 'is_active', 'created_at', 'updated_at']);
    const field = sortBy && allowed.has(sortBy) ? sortBy : 'order_index';
    const normalizedOrder = (sortOrder || '').toLowerCase();
    const ascending = normalizedOrder === 'asc' || normalizedOrder === 'ascend';
    return { field, ascending };
  }

  async findAll(
    yearLevel?: number,
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

    let query = this.supabaseAdmin
      .from('subjects')
      .select('*', shouldPaginate ? { count: 'exact' } : undefined);

    if (yearLevel !== undefined) {
      query = query.eq('year_level', yearLevel);
    }

    if (isActive) {
      query = query.eq('is_active', true);
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`code.ilike.${term},name.ilike.${term},description.ilike.${term}`);
    }

    if (shouldPaginate) {
      const from = (safePage - 1) * safePageSize;
      const to = from + safePageSize - 1;
      query = query.range(from, to);
    }

    const sort = this.resolveSort(sortBy, sortOrder);
    const { data, error, count } = await query.order(sort.field, { ascending: sort.ascending });

    if (error) {
      this.logger.warn(`Failed to fetch subjects (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'subject' }, 'Failed to fetch subjects');
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
    // Get subject
    const { data: subject, error: subjectError } = await this.supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (subjectError) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'subject', id }, 'Subject not found');
    }

    // Get sections with lectures and resources
    const { data: sections, error: sectionsError } = await this.supabaseAdmin
      .from('sections')
      .select(`
        *,
        lectures:lectures(
          *,
          resources:resources(*)
        )
      `)
      .eq('subject_id', id)
      .eq('is_active', true)
      .order('order_index');

    if (sectionsError) {
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'section', subjectId: id }, 'Failed to fetch sections');
    }

    // Sort nested data
    const sortedSections = sections?.map(section => ({
      ...section,
      lectures: section.lectures
        ?.filter((l: { is_active: boolean }) => l.is_active)
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
        .map((lecture: { resources: Array<{ is_active: boolean; order_index: number }> }) => ({
          ...lecture,
          resources: lecture.resources
            ?.filter((r: { is_active: boolean }) => r.is_active)
            .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index),
        })),
    }));

    return {
      ...subject,
      sections: sortedSections,
    };
  }

  async create(data: any) {
    const { data: result, error } = await this.supabaseAdmin
      .from('subjects')
      .insert(data)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to create subject (code=${error.code ?? 'unknown'})`);
      this.mapSubjectWriteError(error);
    }

    return result;
  }

  async update(id: string, data: any) {
    // Get old data for audit
    const { data: oldData } = await this.supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    const { data: result, error } = await this.supabaseAdmin
      .from('subjects')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to update subject (code=${error.code ?? 'unknown'})`);
      this.mapSubjectWriteError(error);
    }

    return { oldData, newData: result };
  }

  async delete(id: string) {
    // Get old data for audit
    const { data: oldData } = await this.supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await this.supabaseAdmin
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.warn(`Failed to delete subject (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'subject', id }, 'Failed to delete subject');
    }

    return { oldData };
  }

  async reorder(items: Array<{ id: string; order_index: number }>) {
    for (const item of items) {
      const { error } = await this.supabaseAdmin
        .from('subjects')
        .update({ order_index: item.order_index })
        .eq('id', item.id);

      if (error) {
        this.logger.warn(`Failed to reorder subjects (code=${error.code ?? 'unknown'})`);
        throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'subject_order' }, 'Failed to reorder subjects');
      }
    }

    return { message: 'Subjects reordered successfully' };
  }
}
