/**
 * Learning Resources Service
 * Business logic for "Learning Hub" cards shown on the student portal and a
 * public detail page. Each card carries an optional image (uploaded to the
 * public `learning-resource-images` bucket), a flat `technologies` tag list and
 * inline `categories` (JSONB: [{ name, links: [{ label, url }] }]).
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

const IMAGE_BUCKET = 'learning-resource-images';

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
export class LearningResourcesService {
  private readonly logger = new Logger(LearningResourcesService.name);
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

  private resolveSort(sortBy?: string, sortOrder?: string): { field: string; ascending: boolean } {
    const allowed = new Set(['title', 'author_name', 'is_published', 'order_index', 'created_at', 'updated_at']);
    const field = sortBy && allowed.has(sortBy) ? sortBy : 'order_index';
    const normalizedOrder = (sortOrder || '').toLowerCase();
    const ascending = field === 'order_index' ? true : normalizedOrder === 'asc' || normalizedOrder === 'ascend';
    return { field, ascending };
  }

  /** Empty strings from the admin form become NULL columns. */
  private normalizeNullable(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = String(value).trim();
    return trimmed === '' ? null : trimmed;
  }

  /** Normalize the technologies tag list to a clean, trimmed string[]. */
  private normalizeTechnologies(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((tag) => String(tag).trim())
      .filter((tag) => tag.length > 0);
  }

  /** Normalize categories JSON to [{ name, links: [{ label, url }] }], dropping empties. */
  private normalizeCategories(value: unknown): Array<{ name: string; links: Array<{ label: string; url: string }> }> {
    if (!Array.isArray(value)) return [];
    return value
      .map((category) => {
        const name = String((category as any)?.name ?? '').trim();
        const rawLinks = Array.isArray((category as any)?.links) ? (category as any).links : [];
        const links = rawLinks
          .map((link: any) => ({
            label: String(link?.label ?? '').trim(),
            url: String(link?.url ?? '').trim(),
          }))
          .filter((link: { label: string; url: string }) => link.url.length > 0);
        return { name, links };
      })
      .filter((category) => category.name.length > 0 || category.links.length > 0);
  }

  /**
   * Public: list published cards, ordered by order_index then newest first.
   */
  async findAllPublic(page?: number, pageSize?: number) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 60));

    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    const { data, error, count } = await this.supabaseAdmin
      .from('learning_resources')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      this.logger.warn(`Failed to fetch learning resources (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.LEARNING_RESOURCE_OPERATION_FAILED,
        { resource: 'learning_resources' },
        'Failed to fetch learning resources',
      );
    }

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

  /**
   * Public: single published card.
   */
  async findOnePublic(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('learning_resources')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      throw new AppException(
        ErrorCode.LEARNING_RESOURCE_NOT_FOUND,
        { resource: 'learning_resources', id },
        'Learning resource not found',
      );
    }

    return data;
  }

  /**
   * Admin: list all cards with search, sort and pagination.
   */
  async findAll(
    search?: string,
    isPublished?: string,
    sortBy?: string,
    sortOrder?: string,
    page?: number,
    pageSize?: number,
  ) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 15));

    let query = this.supabaseAdmin.from('learning_resources').select('*', { count: 'exact' });

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term},author_name.ilike.${term}`);
    }
    if (isPublished !== undefined && isPublished !== '') {
      query = query.eq('is_published', isPublished === 'true');
    }

    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;
    query = query.range(from, to);

    const sort = this.resolveSort(sortBy, sortOrder);
    const { data, error, count } = await query.order(sort.field, { ascending: sort.ascending });

    if (error) {
      this.logger.warn(`Failed to fetch learning resources (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.LEARNING_RESOURCE_OPERATION_FAILED,
        { resource: 'learning_resources' },
        'Failed to fetch learning resources',
      );
    }

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

  /**
   * Admin: get single card.
   */
  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('learning_resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AppException(
        ErrorCode.LEARNING_RESOURCE_NOT_FOUND,
        { resource: 'learning_resources', id },
        'Learning resource not found',
      );
    }

    return data;
  }

  /**
   * Admin: create card.
   */
  async create(data: any) {
    const payload: Record<string, unknown> = {
      title: data.title,
      description: this.normalizeNullable(data.description) ?? null,
      image_url: this.normalizeNullable(data.image_url) ?? null,
      author_name: this.normalizeNullable(data.author_name) ?? null,
      technologies: this.normalizeTechnologies(data.technologies),
      categories: this.normalizeCategories(data.categories),
      is_published: data.is_published ?? true,
    };
    if (typeof data.order_index === 'number') payload.order_index = data.order_index;

    const { data: result, error } = await this.supabaseAdmin
      .from('learning_resources')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      this.logger.warn(`Failed to create learning resource (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.LEARNING_RESOURCE_OPERATION_FAILED,
        { resource: 'learning_resources' },
        'Failed to create learning resource',
      );
    }

    return result;
  }

  /**
   * Admin: update card.
   */
  async update(id: string, data: any) {
    const existing = await this.findOne(id);

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = this.normalizeNullable(data.description);
    if (data.image_url !== undefined) updateData.image_url = this.normalizeNullable(data.image_url);
    if (data.author_name !== undefined) updateData.author_name = this.normalizeNullable(data.author_name);
    if (data.technologies !== undefined) updateData.technologies = this.normalizeTechnologies(data.technologies);
    if (data.categories !== undefined) updateData.categories = this.normalizeCategories(data.categories);
    if (data.is_published !== undefined) updateData.is_published = data.is_published;
    if (data.order_index !== undefined) updateData.order_index = data.order_index;

    const { data: result, error } = await this.supabaseAdmin
      .from('learning_resources')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.warn(`Failed to update learning resource (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.LEARNING_RESOURCE_OPERATION_FAILED,
        { resource: 'learning_resources', id },
        'Failed to update learning resource',
      );
    }

    return { oldData: existing, newData: result };
  }

  /**
   * Admin: delete card.
   */
  async delete(id: string) {
    const existing = await this.findOne(id);

    const { error } = await this.supabaseAdmin.from('learning_resources').delete().eq('id', id);

    if (error) {
      this.logger.warn(`Failed to delete learning resource (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.LEARNING_RESOURCE_OPERATION_FAILED,
        { resource: 'learning_resources', id },
        'Failed to delete learning resource',
      );
    }

    return { oldData: existing };
  }

  /**
   * Admin: upload an image to the public `learning-resource-images` bucket and
   * return its public URL. The service-role key bypasses RLS, so no write policy
   * is needed.
   */
  async uploadImage(file: UploadedImageFile): Promise<{ url: string }> {
    const ext = EXTENSION_BY_MIME[file.mimetype];
    if (!ext) {
      throw new AppException(
        ErrorCode.LEARNING_RESOURCE_UPLOAD_FAILED,
        { resource: 'learning_resources' },
        'Image must be a PNG, JPEG or WebP image',
      );
    }

    const path = `${randomUUID()}.${ext}`;
    const { error } = await this.supabaseAdmin.storage
      .from(IMAGE_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) {
      this.logger.warn(`Failed to upload learning resource image (${error.message})`);
      throw new AppException(
        ErrorCode.LEARNING_RESOURCE_UPLOAD_FAILED,
        { resource: 'learning_resources' },
        'Failed to upload image',
      );
    }

    const { data } = this.supabaseAdmin.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  }
}
