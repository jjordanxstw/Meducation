/**
 * News Service
 * Business logic for "Hot News" articles shown on the student home dashboard
 * and a public detail page. Articles carry a markdown `body`, an optional cover
 * image (uploaded to the public `news-covers` bucket) and a joined category.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

const COVER_BUCKET = 'news-covers';

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

// Selects the article plus its joined category (id, name, color) for rendering.
const NEWS_SELECT = '*, category:news_categories(id, name, color)';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
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
    const allowed = new Set(['title', 'author_name', 'is_featured', 'is_published', 'published_at', 'created_at', 'updated_at']);
    const field = sortBy && allowed.has(sortBy) ? sortBy : 'published_at';
    const normalizedOrder = (sortOrder || '').toLowerCase();
    const ascending = normalizedOrder === 'asc' || normalizedOrder === 'ascend';
    return { field, ascending };
  }

  /** Empty strings from the admin form become NULL columns. */
  private normalizeNullable(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = String(value).trim();
    return trimmed === '' ? null : trimmed;
  }

  /**
   * Public: list published articles, newest first. Optional `categoryId` filter.
   */
  async findAllPublic(page?: number, pageSize?: number, categoryId?: string) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 12));

    let query = this.supabaseAdmin
      .from('news')
      .select(NEWS_SELECT, { count: 'exact' })
      .eq('is_published', true);

    if (categoryId?.trim()) {
      query = query.eq('category_id', categoryId.trim());
    }

    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    const { data, error, count } = await query
      .order('published_at', { ascending: false })
      .range(from, to);

    if (error) {
      this.logger.warn(`Failed to fetch news (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.NEWS_OPERATION_FAILED, { resource: 'news' }, 'Failed to fetch news');
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
   * Public: single published article.
   */
  async findOnePublic(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('news')
      .select(NEWS_SELECT)
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      throw new AppException(ErrorCode.NEWS_NOT_FOUND, { resource: 'news', id }, 'News article not found');
    }

    return data;
  }

  /**
   * Admin: list all articles with search, sort and pagination.
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

    let query = this.supabaseAdmin.from('news').select(NEWS_SELECT, { count: 'exact' });

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`title.ilike.${term},summary.ilike.${term},author_name.ilike.${term}`);
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
      this.logger.warn(`Failed to fetch news (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.NEWS_OPERATION_FAILED, { resource: 'news' }, 'Failed to fetch news');
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
   * Admin: get single article.
   */
  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('news')
      .select(NEWS_SELECT)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AppException(ErrorCode.NEWS_NOT_FOUND, { resource: 'news', id }, 'News article not found');
    }

    return data;
  }

  /**
   * Admin: create article.
   */
  async create(data: any) {
    const newsData: Record<string, unknown> = {
      title: data.title,
      summary: this.normalizeNullable(data.summary) ?? null,
      body: data.body,
      cover_image_url: this.normalizeNullable(data.cover_image_url) ?? null,
      author_name: this.normalizeNullable(data.author_name) ?? null,
      category_id: this.normalizeNullable(data.category_id) ?? null,
      is_featured: data.is_featured ?? false,
      is_published: data.is_published ?? true,
    };
    if (data.published_at) newsData.published_at = data.published_at;

    const { data: result, error } = await this.supabaseAdmin
      .from('news')
      .insert(newsData)
      .select(NEWS_SELECT)
      .single();

    if (error) {
      this.logger.warn(`Failed to create news (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.NEWS_OPERATION_FAILED, { resource: 'news' }, 'Failed to create news article');
    }

    return result;
  }

  /**
   * Admin: update article.
   */
  async update(id: string, data: any) {
    const existing = await this.findOne(id);

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.summary !== undefined) updateData.summary = this.normalizeNullable(data.summary);
    if (data.body !== undefined) updateData.body = data.body;
    if (data.cover_image_url !== undefined) updateData.cover_image_url = this.normalizeNullable(data.cover_image_url);
    if (data.author_name !== undefined) updateData.author_name = this.normalizeNullable(data.author_name);
    if (data.category_id !== undefined) updateData.category_id = this.normalizeNullable(data.category_id);
    if (data.is_featured !== undefined) updateData.is_featured = data.is_featured;
    if (data.is_published !== undefined) updateData.is_published = data.is_published;
    if (data.published_at !== undefined) updateData.published_at = data.published_at;

    const { data: result, error } = await this.supabaseAdmin
      .from('news')
      .update(updateData)
      .eq('id', id)
      .select(NEWS_SELECT)
      .single();

    if (error) {
      this.logger.warn(`Failed to update news (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.NEWS_OPERATION_FAILED, { resource: 'news', id }, 'Failed to update news article');
    }

    return { oldData: existing, newData: result };
  }

  /**
   * Admin: delete article.
   */
  async delete(id: string) {
    const existing = await this.findOne(id);

    const { error } = await this.supabaseAdmin.from('news').delete().eq('id', id);

    if (error) {
      this.logger.warn(`Failed to delete news (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.NEWS_OPERATION_FAILED, { resource: 'news', id }, 'Failed to delete news article');
    }

    return { oldData: existing };
  }

  /**
   * Admin: upload a cover image to the public `news-covers` bucket and return its
   * public URL. The service-role key bypasses RLS, so no write policy is needed.
   */
  async uploadCover(file: UploadedImageFile): Promise<{ url: string }> {
    const ext = EXTENSION_BY_MIME[file.mimetype];
    if (!ext) {
      throw new AppException(
        ErrorCode.NEWS_UPLOAD_FAILED,
        { resource: 'news' },
        'Cover must be a PNG, JPEG or WebP image',
      );
    }

    const path = `${randomUUID()}.${ext}`;
    const { error } = await this.supabaseAdmin.storage
      .from(COVER_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) {
      this.logger.warn(`Failed to upload news cover (${error.message})`);
      throw new AppException(ErrorCode.NEWS_UPLOAD_FAILED, { resource: 'news' }, 'Failed to upload cover image');
    }

    const { data } = this.supabaseAdmin.storage.from(COVER_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  }
}
