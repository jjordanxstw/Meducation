/**
 * Lectures Service
 * Handles lecture business logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@medical-portal/shared';
import { getSupabaseAdmin } from '../../../../common/supabase/supabase-admin';
import { AppException } from '../../../../common/errors';
import { omitKey } from '../../../../common/utils/omit-key';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class LecturesService {
  private readonly logger = new Logger(LecturesService.name);
  private readonly supabaseAdmin: SupabaseClient<Database>;

  constructor(private configService: ConfigService) {
    this.supabaseAdmin = getSupabaseAdmin(this.configService);
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

  private async assertSectionExists(sectionId: string): Promise<{ id: string; subject_id: string }> {
    const { data, error } = await this.supabaseAdmin
      .from('sections')
      .select('id, subject_id')
      .eq('id', sectionId)
      .single();

    if (error) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: 'section_id', value: sectionId },
        'Section does not exist',
      );
    }

    return data as { id: string; subject_id: string };
  }

  private async assertLectureHierarchy(subjectId: string, sectionId: string): Promise<void> {
    const section = await this.assertSectionExists(sectionId);
    if (section.subject_id !== subjectId) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: 'section_id', value: sectionId, subject_id: subjectId },
        'Section does not belong to subject',
      );
    }
  }

  private mapLectureWriteError(error: { code?: string; message?: string; details?: string | null; hint?: string | null }): never {
    if (error.code === '23503') {
      const signature = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
      if (signature.includes('section_id')) {
        throw new AppException(
          ErrorCode.VALIDATION_INVALID_INPUT,
          { field: 'section_id' },
          'Section does not exist',
        );
      }

      throw new AppException(ErrorCode.VALIDATION_INVALID_INPUT, { resource: 'lecture' }, 'Invalid foreign key reference');
    }

    if (error.code === '23505') {
      const signature = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

      if (signature.includes('idx_lectures_section_title_unique_ci') || signature.includes('(section_id, lower(title))') || signature.includes('(section_id, title)')) {
        throw new AppException(ErrorCode.LECTURE_TITLE_DUPLICATE, { field: 'title' });
      }

      throw new AppException(ErrorCode.RESOURCE_CONFLICT, { resource: 'lecture' }, 'Duplicate lecture data');
    }

    throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'lecture' });
  }

  private resolveSort(
    sortBy?: string,
    sortOrder?: string,
  ): { field: string; ascending: boolean } {
    const allowed = new Set([
      'section_id',
      'title',
      'lecture_date',
      'lecturer_name',
      'order_index',
      'is_active',
      'created_at',
      'updated_at',
    ]);
    const field = sortBy && allowed.has(sortBy) ? sortBy : 'order_index';
    const normalizedOrder = (sortOrder || '').toLowerCase();
    const ascending = normalizedOrder === 'asc' || normalizedOrder === 'ascend';
    return { field, ascending };
  }

  async findAll(
    subjectId?: string,
    sectionId?: string,
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

    let subjectSectionIds: string[] | undefined;

    if (subjectId) {
      const { data: sections, error: sectionsError } = await this.supabaseAdmin
        .from('sections')
        .select('id')
        .eq('subject_id', subjectId);

      if (sectionsError) {
        this.logger.warn(`Failed to fetch sections for subject filter (code=${sectionsError.code ?? 'unknown'})`);
        throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'lecture' }, 'Failed to fetch lectures');
      }

      subjectSectionIds = (sections ?? []).map((section: { id: string }) => section.id);

      if (subjectSectionIds.length === 0) {
        if (shouldPaginate) {
          return {
            data: [],
            pagination: { page: safePage, pageSize: safePageSize, total: 0, totalPages: 0 },
          };
        }
        return [];
      }

      if (sectionId && !subjectSectionIds.includes(sectionId)) {
        if (shouldPaginate) {
          return {
            data: [],
            pagination: { page: safePage, pageSize: safePageSize, total: 0, totalPages: 0 },
          };
        }
        return [];
      }
    }

    let query = this.supabaseAdmin
      .from('lectures')
      .select('*', shouldPaginate ? { count: 'exact' } : undefined);

    if (sectionId) {
      query = query.eq('section_id', sectionId);
    } else if (subjectSectionIds) {
      query = query.in('section_id', subjectSectionIds);
    }
    if (isActive) {
      query = query.eq('is_active', true);
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term},lecturer_name.ilike.${term}`);
    }

    if (shouldPaginate) {
      const from = (safePage - 1) * safePageSize;
      const to = from + safePageSize - 1;
      query = query.range(from, to);
    }

    const sort = this.resolveSort(sortBy, sortOrder);
    const { data, error, count } = await query.order(sort.field, { ascending: sort.ascending });

    if (error) {
      this.logger.warn(`Failed to fetch lectures (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'lecture' }, 'Failed to fetch lectures');
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

  /** Filtering happens in PostgREST through the `!inner` parent embeds. */
  private studentLectureQuery(subjectId?: string, sectionId?: string) {
    let query = this.supabaseAdmin
      .from('lectures')
      .select(`
        *,
        parent_section:sections!lectures_section_id_fkey!inner(
          is_active,
          subject_id,
          parent_subject:subjects!sections_subject_id_fkey!inner(is_active)
        )
      `)
      .eq('is_active', true)
      .eq('parent_section.is_active', true)
      .eq('parent_section.parent_subject.is_active', true);

    if (sectionId) {
      query = query.eq('section_id', sectionId);
    }
    if (subjectId) {
      query = query.eq('parent_section.subject_id', subjectId);
    }
    return query;
  }

  /**
   * Student read path: active lectures whose section and subject are both
   * active, paged past PostgREST's 1,000-row cap (the search index loads all).
   */
  async findAllForStudent(subjectId?: string, sectionId?: string) {
    const rows: Array<Record<string, unknown>> = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await this.studentLectureQuery(subjectId, sectionId)
        .order('order_index', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + 999);

      if (error) {
        this.logger.warn(`Failed to fetch lectures (code=${error.code ?? 'unknown'})`);
        throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'lecture' }, 'Failed to fetch lectures');
      }
      rows.push(...(data ?? []));
      if ((data?.length ?? 0) < 1000) break;
    }

    return rows.map((row) => omitKey(row, 'parent_section'));
  }

  /**
   * Student read path: an inactive lecture, or one under an inactive
   * section/subject, is reported as not found. Inactive resources are dropped.
   */
  async findOneForStudent(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('lectures')
      .select(`
        *,
        resources:resources(*),
        parent_section:sections!lectures_section_id_fkey(
          is_active,
          parent_subject:subjects!sections_subject_id_fkey(is_active)
        )
      `)
      .eq('id', id)
      .single();

    const ancestorsActive = data?.parent_section?.is_active && data.parent_section.parent_subject?.is_active;
    if (error || !data.is_active || !ancestorsActive) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'lecture', id }, 'Lecture not found');
    }

    const { resources, ...lecture } = omitKey(data, 'parent_section');

    return {
      ...lecture,
      resources: (resources ?? [])
        .filter((resource: { is_active: boolean }) => resource.is_active)
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index),
    };
  }

  async create(data: any) {
    const subjectId = this.requireStringField(data, 'subject_id');
    const sectionId = this.requireStringField(data, 'section_id');
    await this.assertLectureHierarchy(subjectId, sectionId);

    const payload = { ...(data || {}) };
    delete payload.subject_id;

    const { data: result, error } = await this.supabaseAdmin
      .from('lectures')
      .insert(payload)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to create lecture (code=${error.code ?? 'unknown'})`);
      this.mapLectureWriteError(error);
    }

    return result;
  }

  async update(id: string, data: any) {
    const subjectId = this.requireStringField(data, 'subject_id');
    const sectionId = this.requireStringField(data, 'section_id');
    await this.assertLectureHierarchy(subjectId, sectionId);

    const payload = { ...(data || {}) };
    delete payload.subject_id;

    const { data: oldData } = await this.supabaseAdmin
      .from('lectures')
      .select('*')
      .eq('id', id)
      .single();

    const { data: result, error } = await this.supabaseAdmin
      .from('lectures')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to update lecture (code=${error.code ?? 'unknown'})`);
      this.mapLectureWriteError(error);
    }

    return { oldData, newData: result };
  }

  async delete(id: string) {
    const { data: oldData } = await this.supabaseAdmin
      .from('lectures')
      .select('*')
      .eq('id', id)
      .single();

    // Hard delete. The FK cascade removes this lecture's resources (0001:124).
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
