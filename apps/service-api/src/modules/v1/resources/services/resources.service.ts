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

  private async assertLectureExists(lectureId: string): Promise<{ id: string; section_id: string }> {
    const { data, error } = await this.supabaseAdmin
      .from('lectures')
      .select('id, section_id')
      .eq('id', lectureId)
      .single();

    if (error) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: 'lecture_id', value: lectureId },
        'Lecture does not exist',
      );
    }

    return data as { id: string; section_id: string };
  }

  private async assertSectionExists(sectionId: string): Promise<{ id: string; subject_id: string }> {
    const { data, error } = await this.supabaseAdmin
      .from('sections')
      .select('id, subject_id')
      .eq('id', sectionId)
      .single();

    if (error || !data) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: 'section_id', value: sectionId },
        'Section does not exist',
      );
    }

    return data as { id: string; subject_id: string };
  }

  private async assertResourceHierarchy(subjectId: string, sectionId: string, lectureId: string): Promise<void> {
    const section = await this.assertSectionExists(sectionId);
    if (section.subject_id !== subjectId) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: 'section_id', value: sectionId, subject_id: subjectId },
        'Section does not belong to subject',
      );
    }

    const lecture = await this.assertLectureExists(lectureId);
    if (lecture.section_id !== sectionId) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: 'lecture_id', value: lectureId, section_id: sectionId },
        'Lecture does not belong to section',
      );
    }
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
    if (error.code === '23503') {
      const signature = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
      if (signature.includes('lecture_id')) {
        throw new AppException(
          ErrorCode.VALIDATION_INVALID_INPUT,
          { field: 'lecture_id' },
          'Lecture does not exist',
        );
      }

      throw new AppException(ErrorCode.VALIDATION_INVALID_INPUT, { resource: 'resource' }, 'Invalid foreign key reference');
    }

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

  private mapHierarchyWriteError(error: { code?: string; message?: string; details?: string | null; hint?: string | null }): never {
    if (error.code === '23505') {
      const signature = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

      if (signature.includes('subjects_code_key') || signature.includes('(code)')) {
        throw new AppException(ErrorCode.SUBJECT_CODE_DUPLICATE, { field: 'subject_code' });
      }
      if (signature.includes('idx_subjects_name_unique_ci') || signature.includes('(name)')) {
        throw new AppException(ErrorCode.SUBJECT_NAME_DUPLICATE, { field: 'subject_name' });
      }
      if (signature.includes('idx_sections_subject_name_unique_ci') || signature.includes('(subject_id, lower(name))')) {
        throw new AppException(ErrorCode.SECTION_NAME_DUPLICATE, { field: 'section_name' });
      }
      if (signature.includes('idx_lectures_section_title_unique_ci') || signature.includes('(section_id, lower(title))')) {
        throw new AppException(ErrorCode.LECTURE_TITLE_DUPLICATE, { field: 'lecture_name' });
      }

      throw new AppException(ErrorCode.RESOURCE_CONFLICT, { resource: 'resource_hierarchy' });
    }

    this.mapResourceWriteError(error);
  }

  private resolveSort(
    sortBy?: string,
    sortOrder?: string,
  ): { field: string; ascending: boolean; isDerivedField: boolean } {
    const directFields = new Set(['lecture_id', 'label', 'type', 'url', 'order_index', 'is_active', 'created_at', 'updated_at']);
    const derivedFields = new Set(['lecture_title', 'section_name', 'subject_name', 'subject_code']);
    const normalizedOrder = (sortOrder || '').toLowerCase();
    const ascending = normalizedOrder === 'asc' || normalizedOrder === 'ascend';

    if (sortBy && directFields.has(sortBy)) {
      return { field: sortBy, ascending, isDerivedField: false };
    }
    if (sortBy && derivedFields.has(sortBy)) {
      return { field: sortBy, ascending, isDerivedField: true };
    }

    return { field: 'order_index', ascending: true, isDerivedField: false };
  }

  async findAll(
    subjectId?: string,
    sectionId?: string,
    lectureId?: string,
    type?: string,
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

    let scopedSectionIds: string[] | undefined;
    let sectionLectureIds: string[] | undefined;

    if (subjectId) {
      const { data: sections, error: sectionsError } = await this.supabaseAdmin
        .from('sections')
        .select('id')
        .eq('subject_id', subjectId);

      if (sectionsError) {
        this.logger.warn(`Failed to fetch sections for subject filter (code=${sectionsError.code ?? 'unknown'})`);
        throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'resource' }, 'Failed to fetch resources');
      }

      scopedSectionIds = (sections ?? []).map((section: { id: string }) => section.id);
      if (scopedSectionIds.length === 0) {
        if (shouldPaginate) {
          return {
            data: [],
            pagination: { page: safePage, pageSize: safePageSize, total: 0, totalPages: 0 },
          };
        }
        return [];
      }

      if (sectionId && !scopedSectionIds.includes(sectionId)) {
        if (shouldPaginate) {
          return {
            data: [],
            pagination: { page: safePage, pageSize: safePageSize, total: 0, totalPages: 0 },
          };
        }
        return [];
      }
    }

    if (sectionId || scopedSectionIds) {
      const { data: lectures, error: lecturesError } = await this.supabaseAdmin
        .from('lectures')
        .select('id')
        .in('section_id', sectionId ? [sectionId] : scopedSectionIds || []);

      if (lecturesError) {
        this.logger.warn(`Failed to fetch lectures for section filter (code=${lecturesError.code ?? 'unknown'})`);
        throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'resource' }, 'Failed to fetch resources');
      }

      sectionLectureIds = (lectures ?? []).map((lecture: { id: string }) => lecture.id);

      if (sectionLectureIds.length === 0) {
        if (shouldPaginate) {
          return {
            data: [],
            pagination: { page: safePage, pageSize: safePageSize, total: 0, totalPages: 0 },
          };
        }
        return [];
      }

      if (lectureId && !sectionLectureIds.includes(lectureId)) {
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
      .from('resources')
      .select(`
        *,
        lecture:lectures!resources_lecture_id_fkey(
          id,
          title,
          section_id,
          section:sections!lectures_section_id_fkey(
            id,
            name,
            subject_id,
            subject:subjects!sections_subject_id_fkey(
              id,
              code,
              name,
              year_level
            )
          )
        )
      `, shouldPaginate ? { count: 'exact' } : undefined);

    if (lectureId) {
      query = query.eq('lecture_id', lectureId);
    } else if (sectionLectureIds) {
      query = query.in('lecture_id', sectionLectureIds);
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

    const sort = this.resolveSort(sortBy, sortOrder);
    if (!sort.isDerivedField) {
      query = query.order(sort.field, { ascending: sort.ascending });
      if (shouldPaginate) {
        const from = (safePage - 1) * safePageSize;
        const to = from + safePageSize - 1;
        query = query.range(from, to);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.warn(`Failed to fetch resources (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'resource' }, 'Failed to fetch resources');
    }

    const mappedRows = (data ?? []).map((item: any) => ({
      ...item,
      lecture_title: item.lecture?.title ?? null,
      section_id: item.lecture?.section?.id ?? null,
      section_name: item.lecture?.section?.name ?? null,
      subject_id: item.lecture?.section?.subject?.id ?? null,
      subject_code: item.lecture?.section?.subject?.code ?? null,
      subject_name: item.lecture?.section?.subject?.name ?? null,
      subject_year_level: item.lecture?.section?.subject?.year_level ?? null,
    }));

    if (sort.isDerivedField) {
      mappedRows.sort((left: any, right: any) => {
        const leftValue = (left[sort.field] ?? '').toString().toLowerCase();
        const rightValue = (right[sort.field] ?? '').toString().toLowerCase();
        const order = leftValue.localeCompare(rightValue);
        return sort.ascending ? order : -order;
      });

      if (shouldPaginate) {
        const from = (safePage - 1) * safePageSize;
        const to = from + safePageSize;
        const pagedRows = mappedRows.slice(from, to);
        const total = mappedRows.length;
        return {
          data: pagedRows,
          pagination: {
            page: safePage,
            pageSize: safePageSize,
            total,
            totalPages: Math.ceil(total / safePageSize),
          },
        };
      }
    }

    if (shouldPaginate) {
      const total = count ?? mappedRows.length;
      return {
        data: mappedRows,
        pagination: {
          page: safePage,
          pageSize: safePageSize,
          total,
          totalPages: Math.ceil(total / safePageSize),
        },
      };
    }

    return mappedRows;
  }

  async fullCreate(payload: any) {
    const subjectId = typeof payload?.subject_id === 'string' ? payload.subject_id : null;
    const subjectName = typeof payload?.subject_name === 'string' ? payload.subject_name.trim() : null;
    const sectionId = typeof payload?.section_id === 'string' ? payload.section_id : null;
    const sectionName = typeof payload?.section_name === 'string' ? payload.section_name.trim() : null;
    const lectureId = typeof payload?.lecture_id === 'string' ? payload.lecture_id : null;
    const lectureName = typeof payload?.lecture_name === 'string' ? payload.lecture_name.trim() : null;

    if (!subjectId && !subjectName) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: 'subject_id|subject_name' },
        'subject_id or subject_name is required',
      );
    }
    if (!sectionId && !sectionName) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: 'section_id|section_name' },
        'section_id or section_name is required',
      );
    }
    if (!lectureId && !lectureName) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: 'lecture_id|lecture_name' },
        'lecture_id or lecture_name is required',
      );
    }

    const label = this.requireStringField(payload, 'label');
    const url = this.requireStringField(payload, 'url');
    const type = this.requireStringField(payload, 'type');
    this.validateResourcePayload({ url });

    const rpcPayload = {
      resource_id: typeof payload?.resource_id === 'string' ? payload.resource_id : null,
      subject_id: subjectId,
      subject_name: subjectName,
      subject_code: typeof payload?.subject_code === 'string' ? payload.subject_code.trim() : null,
      subject_year_level: typeof payload?.subject_year_level === 'number' ? payload.subject_year_level : null,
      section_id: sectionId,
      section_name: sectionName,
      lecture_id: lectureId,
      lecture_name: lectureName,
      label,
      url,
      type,
      file_size_bytes: typeof payload?.file_size_bytes === 'number' ? payload.file_size_bytes : null,
      duration_seconds: typeof payload?.duration_seconds === 'number' ? payload.duration_seconds : null,
      order_index: typeof payload?.order_index === 'number' ? payload.order_index : 0,
      is_active: typeof payload?.is_active === 'boolean' ? payload.is_active : true,
    };

    const { data, error } = await this.supabaseAdmin.rpc('admin_full_create_resource', {
      payload: rpcPayload,
    });

    if (error) {
      this.logger.warn(`Failed to full-create resource hierarchy (code=${error.code ?? 'unknown'})`);
      this.mapHierarchyWriteError(error);
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
    const subjectId = this.requireStringField(data, 'subject_id');
    const sectionId = this.requireStringField(data, 'section_id');
    const lectureId = this.requireStringField(data, 'lecture_id');
    await this.assertResourceHierarchy(subjectId, sectionId, lectureId);
    this.validateResourcePayload(data);

    const payload = { ...(data || {}) };
    delete payload.subject_id;
    delete payload.section_id;

    const { data: result, error } = await this.supabaseAdmin
      .from('resources')
      .insert(payload)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to create resource (code=${error.code ?? 'unknown'})`);
      this.mapResourceWriteError(error);
    }

    return result;
  }

  async bulkCreate(resources: any[]) {
    for (const item of resources) {
      const subjectId = this.requireStringField(item, 'subject_id');
      const sectionId = this.requireStringField(item, 'section_id');
      const lectureId = this.requireStringField(item, 'lecture_id');
      await this.assertResourceHierarchy(subjectId, sectionId, lectureId);
      this.validateResourcePayload(item);
    }

    const payload = resources.map((item) => {
      const normalizedItem = { ...(item || {}) };
      delete normalizedItem.subject_id;
      delete normalizedItem.section_id;
      return normalizedItem;
    });

    const { data, error } = await this.supabaseAdmin
      .from('resources')
      .insert(payload)
      .select();

    if (error) {
      this.logger.warn(`Failed to create resources (code=${error.code ?? 'unknown'})`);
      this.mapResourceWriteError(error);
    }

    return data;
  }

  async update(id: string, data: any) {
    const subjectId = this.requireStringField(data, 'subject_id');
    const sectionId = this.requireStringField(data, 'section_id');
    const lectureId = this.requireStringField(data, 'lecture_id');
    await this.assertResourceHierarchy(subjectId, sectionId, lectureId);
    this.validateResourcePayload(data);

    const payload = { ...(data || {}) };
    delete payload.subject_id;
    delete payload.section_id;

    const { data: oldData } = await this.supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    const { data: result, error } = await this.supabaseAdmin
      .from('resources')
      .update(payload)
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
