/**
 * Subjects Service
 * Handles subject business logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@medical-portal/shared';
import { getSupabaseAdmin } from '../../../../common/supabase/supabase-admin';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

const SUBJECT_IMAGE_BUCKET = 'subject-images';
/** PostgREST's per-request row cap. */
const PAGE_SIZE = 1000;
/** A lecture counts as "new" on subject cards for this many days. */
const NEW_LECTURE_WINDOW_DAYS = 7;

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
  private readonly supabaseAdmin: SupabaseClient<Database>;

  constructor(private configService: ConfigService) {
    this.supabaseAdmin = getSupabaseAdmin(this.configService);
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

  /**
   * Student subject list with the counts the subject cards show
   * ("4 sections · 24 lectures", "2 new"). Computed from the existing tables —
   * no schema change — with every query paged past PostgREST's 1,000-row cap.
   * "New" means a lecture created in the last `NEW_LECTURE_WINDOW_DAYS` days.
   */
  async findAllForStudentWithStats(yearLevel?: number) {
    const subjects = ((await this.findAll(yearLevel, true)) ?? []) as Array<Record<string, unknown> & { id: string }>;
    if (subjects.length === 0) {
      return [];
    }

    const subjectIds = subjects.map((subject) => subject.id);
    const sections = await this.fetchAllPages<{ id: string; subject_id: string }>((from, to) =>
      this.supabaseAdmin
        .from('sections')
        .select('id, subject_id')
        .in('subject_id', subjectIds)
        .eq('is_active', true)
        .order('id')
        .range(from, to),
    );

    const subjectBySection = new Map(sections.map((section) => [section.id, section.subject_id]));
    const lectures = sections.length
      ? await this.fetchAllPages<{ section_id: string; created_at: string }>((from, to) =>
          this.supabaseAdmin
            .from('lectures')
            .select('section_id, created_at')
            .in('section_id', [...subjectBySection.keys()])
            .eq('is_active', true)
            .order('id')
            .range(from, to),
        )
      : [];

    // Files = every active non-video resource (slides, PDFs, links) under an active lecture.
    const files = sections.length
      ? await this.fetchAllPages<{ type: string; lecture: { section_id: string } | null }>((from, to) =>
          this.supabaseAdmin
            .from('resources')
            .select('type, lecture:lectures!resources_lecture_id_fkey!inner(section_id, is_active)')
            .eq('is_active', true)
            .eq('lecture.is_active', true)
            .in('lecture.section_id', [...subjectBySection.keys()])
            .not('type', 'in', '(youtube,gdrive_video)')
            .order('id')
            .range(from, to),
        )
      : [];

    const newSince = Date.now() - NEW_LECTURE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const stats = new Map<
      string,
      { sections: number; lectures: number; files: number; newLectures: number; latest: string | null }
    >();
    for (const id of subjectIds) {
      stats.set(id, { sections: 0, lectures: 0, files: 0, newLectures: 0, latest: null });
    }
    for (const file of files) {
      const subjectId = file.lecture ? subjectBySection.get(file.lecture.section_id) : undefined;
      if (subjectId) stats.get(subjectId)!.files += 1;
    }
    for (const section of sections) {
      stats.get(section.subject_id)!.sections += 1;
    }
    for (const lecture of lectures) {
      const subjectId = subjectBySection.get(lecture.section_id);
      const entry = subjectId ? stats.get(subjectId) : undefined;
      if (!entry) continue;
      entry.lectures += 1;
      if (new Date(lecture.created_at).getTime() >= newSince) entry.newLectures += 1;
      if (!entry.latest || lecture.created_at > entry.latest) entry.latest = lecture.created_at;
    }

    return subjects.map((subject) => {
      const entry = stats.get(subject.id)!;
      return {
        ...subject,
        sections_count: entry.sections,
        lectures_count: entry.lectures,
        files_count: entry.files,
        new_lectures_count: entry.newLectures,
        latest_lecture_at: entry.latest,
      };
    });
  }

  private async fetchAllPages<T>(
    buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { code?: string } | null }>,
  ): Promise<T[]> {
    const rows: T[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);
      if (error) {
        this.logger.warn(`Failed to fetch subject stats (code=${error.code ?? 'unknown'})`);
        throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'subject' }, 'Failed to fetch subjects');
      }
      rows.push(...(data ?? []));
      if ((data?.length ?? 0) < PAGE_SIZE) return rows;
    }
  }

  /**
   * `activeOnly` is the student read path: an inactive subject is reported as
   * not found instead of being served by direct ID.
   */
  async findOne(id: string, options: { activeOnly?: boolean } = {}) {
    // Get subject
    const { data: subject, error: subjectError } = await this.supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (subjectError || (options.activeOnly && !subject.is_active)) {
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

  /**
   * Admin-only variant of findOne for the unified tree editor. Returns the full
   * subject hierarchy INCLUDING inactive sections/lectures/resources. `findOne`
   * stays untouched because it is shared with the student-facing read path.
   */
  async findOneForEdit(id: string) {
    const { data: subject, error: subjectError } = await this.supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
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
      .order('order_index');

    if (sectionsError) {
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'section', subjectId: id }, 'Failed to fetch sections');
    }

    const sortedSections = (sections ?? []).map((section: any) => ({
      ...section,
      lectures: (section.lectures ?? [])
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
        .map((lecture: { resources: Array<{ order_index: number }> }) => ({
          ...lecture,
          resources: (lecture.resources ?? []).sort(
            (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index,
          ),
        })),
    }));

    return { ...subject, sections: sortedSections, tree_version: this.treeVersion(subject, sortedSections) };
  }

  /**
   * Current tree fingerprint plus who saved the subject last (from the audit
   * log), so an open editor can warn before it overwrites someone else's save.
   */
  async getTreeVersion(id: string) {
    const [tree, audit] = await Promise.all([
      this.findOneForEdit(id),
      this.supabaseAdmin
        .from('audit_logs')
        .select('user_email, created_at')
        .eq('table_name', 'subjects')
        .eq('record_id', id)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);
    const last = audit.data?.[0];
    return {
      tree_version: tree.tree_version,
      last_saved_by: last?.user_email ?? null,
      last_saved_at: last?.created_at ?? null,
    };
  }

  /**
   * Fingerprint of the whole editable tree: every row's id + updated_at. Any
   * edit, insert or delete anywhere in the subject changes it, so the editor can
   * tell when someone else saved in the meantime (no schema change needed).
   */
  private treeVersion(subject: { id: string; updated_at: string }, sections: any[]): string {
    const rows = [`subject:${subject.id}:${subject.updated_at}`];
    for (const section of sections) {
      rows.push(`section:${section.id}:${section.updated_at}`);
      for (const lecture of section.lectures ?? []) {
        rows.push(`lecture:${lecture.id}:${lecture.updated_at}`);
        for (const resource of lecture.resources ?? []) {
          rows.push(`resource:${resource.id}:${resource.updated_at}`);
        }
      }
    }
    return createHash('sha1').update(rows.sort().join('|')).digest('hex');
  }

  /**
   * Atomically reconcile the whole subject tree (sections/lectures/resources) to
   * match the payload via the admin_save_subject_tree RPC. order_index is derived
   * server-side from array position, so the client never sends it.
   */
  async saveTree(id: string, payload: any) {
    const rpcPayload = this.normalizeTreePayload(id, payload);

    // Optimistic concurrency: refuse to overwrite a tree that changed after the
    // editor loaded it (two admins, or two tabs). Older clients omit the field.
    if (typeof payload?.expected_version === 'string') {
      const current = await this.findOneForEdit(id);
      if (current.tree_version !== payload.expected_version) {
        throw new AppException(
          ErrorCode.RESOURCE_CONFLICT,
          { resource: 'subject', id },
          'This subject was changed by someone else after you opened it. Reload to see the latest version before saving.',
        );
      }
    }

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
    const { data: oldData } = await this.supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    // Hard delete. The FK cascade (0001:85,103,124) removes the subject's
    // sections, their lectures and those lectures' resources. Calendar events on
    // this subject survive but have their subject_id set to NULL (0001:151).
    const { error } = await this.supabaseAdmin.from('subjects').delete().eq('id', id);

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
