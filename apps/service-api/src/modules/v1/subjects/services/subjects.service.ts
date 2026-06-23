/**
 * Subjects Service
 * Handles subject business logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

const SUBJECT_IMAGE_BUCKET = 'subject-images';

// Minimal shape of a multer file (memoryStorage). Declared locally to avoid a
// dependency on @types/multer; multer ships with @nestjs/platform-express.
export interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

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

  // Maps Postgres write errors raised by the admin_save_subject_tree RPC to the
  // specific duplicate ErrorCode for the offending level (mirrors the resources
  // service's mapHierarchyWriteError).
  private mapTreeWriteError(error: { code?: string; message?: string; details?: string | null; hint?: string | null }): never {
    if (error.code === '23505') {
      const signature = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

      if (signature.includes('subjects_code_key') || signature.includes('(code)')) {
        throw new AppException(ErrorCode.SUBJECT_CODE_DUPLICATE, { field: 'code' });
      }
      if (signature.includes('idx_subjects_name_unique_ci') || signature.includes('subjects_name_key') || signature.includes('(name)')) {
        throw new AppException(ErrorCode.SUBJECT_NAME_DUPLICATE, { field: 'name' });
      }
      if (signature.includes('idx_sections_subject_name_unique_ci') || signature.includes('(subject_id, lower(name))')) {
        throw new AppException(ErrorCode.SECTION_NAME_DUPLICATE, { field: 'section_name' });
      }
      if (signature.includes('idx_lectures_section_title_unique_ci') || signature.includes('(section_id, lower(title))')) {
        throw new AppException(ErrorCode.LECTURE_TITLE_DUPLICATE, { field: 'lecture_title' });
      }
      if (signature.includes('idx_resources_lecture_label_unique_ci') || signature.includes('(lecture_id, lower(label))')) {
        throw new AppException(ErrorCode.RESOURCE_LABEL_DUPLICATE, { field: 'label' });
      }
      if (signature.includes('idx_resources_lecture_url_unique') || signature.includes('(lecture_id, url)')) {
        throw new AppException(ErrorCode.RESOURCE_URL_DUPLICATE, { field: 'url' });
      }

      throw new AppException(ErrorCode.RESOURCE_CONFLICT, { resource: 'subject_tree' }, 'Duplicate data');
    }

    throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'subject_tree' });
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
      .select('*', shouldPaginate ? { count: 'exact' } : undefined)
      .is('deleted_at', null);

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
      .is('deleted_at', null)
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
      .is('deleted_at', null)
      .order('order_index');

    if (sectionsError) {
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'section', subjectId: id }, 'Failed to fetch sections');
    }

    // Sort nested data
    const sortedSections = sections?.map(section => ({
      ...section,
      lectures: section.lectures
        ?.filter((l: { is_active: boolean; deleted_at: string | null }) => l.is_active && !l.deleted_at)
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

  /**
   * Admin-only variant of findOne for the unified tree editor. Returns the full
   * subject hierarchy INCLUDING inactive sections/lectures/resources (still
   * excluding soft-deleted sections/lectures). `findOne` stays untouched because
   * it is shared with the student-facing read path.
   */
  async findOneForEdit(id: string) {
    const { data: subject, error: subjectError } = await this.supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (subjectError) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'subject', id }, 'Subject not found');
    }

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
      .is('deleted_at', null)
      .order('order_index');

    if (sectionsError) {
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'section', subjectId: id }, 'Failed to fetch sections');
    }

    const sortedSections = (sections ?? []).map((section: any) => ({
      ...section,
      lectures: (section.lectures ?? [])
        .filter((l: { deleted_at: string | null }) => !l.deleted_at)
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
        .map((lecture: { resources: Array<{ order_index: number }> }) => ({
          ...lecture,
          resources: (lecture.resources ?? []).sort(
            (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index,
          ),
        })),
    }));

    return { ...subject, sections: sortedSections };
  }

  /**
   * Atomically reconcile the whole subject tree (sections/lectures/resources) to
   * match the payload via the admin_save_subject_tree RPC. order_index is derived
   * server-side from array position, so the client never sends it.
   */
  async saveTree(id: string, payload: any) {
    const rpcPayload = this.normalizeTreePayload(id, payload);

    const { data, error } = await this.supabaseAdmin.rpc('admin_save_subject_tree', {
      payload: rpcPayload,
    });

    if (error) {
      this.logger.warn(`Failed to save subject tree (code=${error.code ?? 'unknown'})`);
      this.mapTreeWriteError(error);
    }

    return data;
  }

  // Whitelist the incoming tree payload to the exact fields the RPC consumes.
  private normalizeTreePayload(id: string, payload: any) {
    const subjectInput = payload?.subject ?? {};
    const subject = {
      code: typeof subjectInput.code === 'string' ? subjectInput.code.trim() : undefined,
      name: typeof subjectInput.name === 'string' ? subjectInput.name.trim() : undefined,
      year_level: typeof subjectInput.year_level === 'number' ? subjectInput.year_level : undefined,
      description: typeof subjectInput.description === 'string' ? subjectInput.description : null,
      thumbnail_url: typeof subjectInput.thumbnail_url === 'string' ? subjectInput.thumbnail_url : null,
      order_index: typeof subjectInput.order_index === 'number' ? subjectInput.order_index : undefined,
      is_active: typeof subjectInput.is_active === 'boolean' ? subjectInput.is_active : undefined,
    };

    const sections = Array.isArray(payload?.sections)
      ? payload.sections.map((section: any) => ({
          id: typeof section?.id === 'string' && section.id ? section.id : null,
          name: typeof section?.name === 'string' ? section.name.trim() : '',
          description: typeof section?.description === 'string' ? section.description : null,
          is_active: typeof section?.is_active === 'boolean' ? section.is_active : true,
          lectures: Array.isArray(section?.lectures)
            ? section.lectures.map((lecture: any) => ({
                id: typeof lecture?.id === 'string' && lecture.id ? lecture.id : null,
                title: typeof lecture?.title === 'string' ? lecture.title.trim() : '',
                description: typeof lecture?.description === 'string' ? lecture.description : null,
                lecture_date:
                  typeof lecture?.lecture_date === 'string' && lecture.lecture_date ? lecture.lecture_date : null,
                lecturer_name: typeof lecture?.lecturer_name === 'string' ? lecture.lecturer_name : null,
                is_active: typeof lecture?.is_active === 'boolean' ? lecture.is_active : true,
                resources: Array.isArray(lecture?.resources)
                  ? lecture.resources.map((resource: any) => ({
                      id: typeof resource?.id === 'string' && resource.id ? resource.id : null,
                      label: typeof resource?.label === 'string' ? resource.label.trim() : '',
                      url: typeof resource?.url === 'string' ? resource.url.trim() : '',
                      type: typeof resource?.type === 'string' ? resource.type : null,
                      is_active: typeof resource?.is_active === 'boolean' ? resource.is_active : true,
                      file_size_bytes:
                        typeof resource?.file_size_bytes === 'number' ? resource.file_size_bytes : null,
                      duration_seconds:
                        typeof resource?.duration_seconds === 'number' ? resource.duration_seconds : null,
                    }))
                  : [],
              }))
            : [],
        }))
      : [];

    return { subject_id: id, subject, sections };
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
      .is('deleted_at', null)
      .single();

    // Soft delete: preserve child records (sections/lectures/resources) instead
    // of CASCADE delete.
    const { error } = await this.supabaseAdmin
      .from('subjects')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .is('deleted_at', null);

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

  /**
   * Admin: upload a subject cover image to the public `subject-images` bucket and
   * return its public URL. The service-role key bypasses RLS, so no write policy
   * on the bucket is required.
   */
  async uploadImage(file: UploadedImageFile): Promise<{ url: string }> {
    const ext = EXTENSION_BY_MIME[file.mimetype];
    if (!ext) {
      throw new AppException(
        ErrorCode.RESOURCE_OPERATION_FAILED,
        { resource: 'subject' },
        'Image must be a PNG, JPEG or WebP file',
      );
    }

    const path = `${randomUUID()}.${ext}`;
    const { error } = await this.supabaseAdmin.storage
      .from(SUBJECT_IMAGE_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) {
      this.logger.warn(`Failed to upload subject image (${error.message})`);
      throw new AppException(
        ErrorCode.RESOURCE_OPERATION_FAILED,
        { resource: 'subject' },
        'Failed to upload subject image',
      );
    }

    const { data } = this.supabaseAdmin.storage.from(SUBJECT_IMAGE_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  }
}
