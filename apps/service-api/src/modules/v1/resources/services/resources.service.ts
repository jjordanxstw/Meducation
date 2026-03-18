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

  async findAll(subjectId?: string, sectionId?: string, lectureId?: string, type?: string, isActive: boolean = true, search?: string) {
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
        return [];
      }

      if (sectionId && !scopedSectionIds.includes(sectionId)) {
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
        return [];
      }

      if (lectureId && !sectionLectureIds.includes(lectureId)) {
        return [];
      }
    }

    let query = this.supabaseAdmin.from('resources').select('*');

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
    const subjectId = this.requireStringField(data, 'subject_id');
    const sectionId = this.requireStringField(data, 'section_id');
    const lectureId = this.requireStringField(data, 'lecture_id');
    await this.assertResourceHierarchy(subjectId, sectionId, lectureId);
    this.validateResourcePayload(data);

    const { subject_id: _subjectId, section_id: _sectionId, ...payload } = data;

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

    const payload = resources.map(({ subject_id, section_id, ...item }) => item);

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

    const { subject_id: _subjectId, section_id: _sectionId, ...payload } = data;

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
