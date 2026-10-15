/**
 * Resources Service
 * Handles resource business logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@medical-portal/shared';
import type { Enums } from '@medical-portal/shared';
import { getSupabaseAdmin } from '../../../../common/supabase/supabase-admin';
import { AppException } from '../../../../common/errors';
import { omitKey } from '../../../../common/utils/omit-key';
import { normalizeLink } from '../../../../common/utils/normalize-link';
import { ErrorCode } from '@medical-portal/shared';

/** PostgREST's per-request row cap; full reads page through in steps of this size. */
const FULL_FETCH_PAGE_SIZE = 1000;

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);
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
    options: { activeAncestors?: boolean; duplicatesOnly?: boolean; flagDuplicates?: boolean } = {},
  ) {
    const shouldPaginate = page !== undefined && pageSize !== undefined;
    const duplicateIds = options.duplicatesOnly || options.flagDuplicates ? await this.duplicateResourceIds() : null;
    if (options.duplicatesOnly && duplicateIds && duplicateIds.size === 0) {
      return shouldPaginate
        ? { data: [], pagination: { page: Math.max(1, Number(page) || 1), pageSize: Number(pageSize) || 15, total: 0, totalPages: 0 } }
        : [];
    }
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

    // !inner joins pull the ancestor lecture/section/subject that this tab
    // displays alongside each resource. Deleting any ancestor now removes the
    // resource outright via the FK cascade, so no extra filtering is needed.
    const buildQuery = (withCount: boolean) => {
      let query = this.supabaseAdmin
        .from('resources')
        .select(`
          *,
          lecture:lectures!resources_lecture_id_fkey!inner(
            id,
            title,
            section_id,
            is_active,
            section:sections!lectures_section_id_fkey!inner(
              id,
              name,
              subject_id,
              is_active,
              subject:subjects!sections_subject_id_fkey!inner(
                id,
                code,
                name,
                year_level,
                is_active
              )
            )
          )
        `, withCount ? { count: 'exact' } : undefined);

      if (options.activeAncestors) {
        query = query
          .eq('lecture.is_active', true)
          .eq('lecture.section.is_active', true)
          .eq('lecture.section.subject.is_active', true);
      }

      if (lectureId) {
        query = query.eq('lecture_id', lectureId);
      } else if (sectionLectureIds) {
        query = query.in('lecture_id', sectionLectureIds);
      }
      if (type) {
        query = query.eq('type', type as Enums<'resource_type'>);
      }
      if (isActive) {
        query = query.eq('is_active', true);
      }
      if (search?.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`label.ilike.${term},url.ilike.${term}`);
      }
      if (options.duplicatesOnly && duplicateIds) {
        query = query.in('id', [...duplicateIds]);
      }
      return query;
    };

    const sort = this.resolveSort(sortBy, sortOrder);
    let data: any[] | null = null;
    let error: { code?: string } | null = null;
    let count: number | null = null;

    if (shouldPaginate && !sort.isDerivedField) {
      const from = (safePage - 1) * safePageSize;
      const to = from + safePageSize - 1;
      ({ data, error, count } = await buildQuery(true)
        .order(sort.field, { ascending: sort.ascending })
        .range(from, to));
    } else {
      // Unpaginated reads and derived-field sorts need every row, but PostgREST
      // returns at most 1,000 per request (D2), so page through with range().
      const rows: any[] = [];
      for (let from = 0; ; from += FULL_FETCH_PAGE_SIZE) {
        const page = await buildQuery(false)
          .order(sort.isDerivedField ? 'order_index' : sort.field, { ascending: sort.isDerivedField || sort.ascending })
          .order('id', { ascending: true })
          .range(from, from + FULL_FETCH_PAGE_SIZE - 1);
        if (page.error) {
          error = page.error;
          break;
        }
        rows.push(...(page.data ?? []));
        if ((page.data?.length ?? 0) < FULL_FETCH_PAGE_SIZE) {
          break;
        }
      }
      data = rows;
    }

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
      ...(duplicateIds ? { is_duplicate: duplicateIds.has(item.id) } : {}),
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

  /**
   * Recording ids (YouTube / Drive video) whose link also appears on another lecture of the same
   * subject (YouTube compared by video id, Drive by file id). Mirrors the
   * dashboard's "links used by more than one lecture" check.
   */
  private async duplicateResourceIds(): Promise<Set<string>> {
    const rows: Array<{ id: string; url: string; lecture_id: string; lecture: { section: { subject_id: string } | null } | null }> = [];
    for (let from = 0; ; from += FULL_FETCH_PAGE_SIZE) {
      const { data, error } = await this.supabaseAdmin
        .from('resources')
        .select('id, url, lecture_id, lecture:lectures!resources_lecture_id_fkey(section:sections!lectures_section_id_fkey(subject_id))')
        .in('type', ['youtube', 'gdrive_video'])
        .order('id')
        .range(from, from + FULL_FETCH_PAGE_SIZE - 1);
      if (error) {
        this.logger.warn(`Failed to scan for duplicate links (code=${error.code ?? 'unknown'})`);
        throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'resource' }, 'Failed to fetch resources');
      }
      rows.push(...((data ?? []) as typeof rows));
      if ((data?.length ?? 0) < FULL_FETCH_PAGE_SIZE) break;
    }

    const groups = new Map<string, Array<{ id: string; lectureId: string }>>();
    for (const row of rows) {
      const key = `${row.lecture?.section?.subject_id ?? ''}|${normalizeLink(row.url)}`;
      groups.set(key, [...(groups.get(key) ?? []), { id: row.id, lectureId: row.lecture_id }]);
    }
    const ids = new Set<string>();
    for (const group of groups.values()) {
      if (new Set(group.map((entry) => entry.lectureId)).size > 1) group.forEach((entry) => ids.add(entry.id));
    }
    return ids;
  }

  /** Student read path: only active resources whose whole ancestor chain is active. */
  async findAllForStudent(subjectId?: string, sectionId?: string, lectureId?: string, type?: string) {
    return this.findAll(
      subjectId,
      sectionId,
      lectureId,
      type,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { activeAncestors: true },
    );
  }

  /**
   * Student read path: an inactive resource, or one under an inactive
   * lecture/section/subject, is reported as not found.
   */
  async findOneForStudent(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('resources')
      .select(`
        *,
        parent_lecture:lectures!resources_lecture_id_fkey(
          is_active,
          parent_section:sections!lectures_section_id_fkey(
            is_active,
            parent_subject:subjects!sections_subject_id_fkey(is_active)
          )
        )
      `)
      .eq('id', id)
      .single();

    const lecture = data?.parent_lecture;
    const ancestorsActive =
      lecture?.is_active && lecture.parent_section?.is_active && lecture.parent_section.parent_subject?.is_active;
    if (error || !data.is_active || !ancestorsActive) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'resource', id }, 'Resource not found');
    }

    return omitKey(data, 'parent_lecture');
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
