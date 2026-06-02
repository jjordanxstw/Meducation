/**
 * News Categories Service
 * Admin CRUD for the news_categories table (name + color). Deleting a category
 * that still has articles is blocked (ON DELETE RESTRICT + an explicit pre-check
 * for a friendly message). Mirrors EventTypesService.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class NewsCategoriesService {
  private readonly logger = new Logger(NewsCategoriesService.name);
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

  private mapWriteError(error: { code?: string; message?: string }): never {
    if (error.code === '23505') {
      throw new AppException(ErrorCode.NEWS_CATEGORY_NAME_DUPLICATE, { field: 'name' });
    }
    if (error.code === '23503') {
      throw new AppException(ErrorCode.NEWS_CATEGORY_IN_USE, { resource: 'news_category' });
    }
    throw new AppException(ErrorCode.NEWS_CATEGORY_OPERATION_FAILED, { resource: 'news_category' });
  }

  async findAll() {
    const { data, error } = await this.supabaseAdmin
      .from('news_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      this.logger.warn(`Failed to fetch news categories (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.NEWS_CATEGORY_OPERATION_FAILED, { resource: 'news_category' }, 'Failed to fetch news categories');
    }

    return data ?? [];
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('news_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new AppException(ErrorCode.NEWS_CATEGORY_NOT_FOUND, { resource: 'news_category', id }, 'News category not found');
    }

    return data;
  }

  async create(payload: { name?: string; color?: string; sort_order?: number }) {
    const insert: Record<string, unknown> = { name: (payload.name ?? '').trim() };
    if (payload.color) insert.color = payload.color;
    if (typeof payload.sort_order === 'number') insert.sort_order = payload.sort_order;

    const { data, error } = await this.supabaseAdmin
      .from('news_categories')
      .insert(insert)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to create news category (code=${error.code ?? 'unknown'})`);
      this.mapWriteError(error);
    }

    return data;
  }

  async update(id: string, payload: { name?: string; color?: string; sort_order?: number }) {
    const { data: oldData } = await this.supabaseAdmin
      .from('news_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (!oldData) {
      throw new AppException(ErrorCode.NEWS_CATEGORY_NOT_FOUND, { resource: 'news_category', id }, 'News category not found');
    }

    const patch: Record<string, unknown> = {};
    if (typeof payload.name === 'string') patch.name = payload.name.trim();
    if (typeof payload.color === 'string') patch.color = payload.color;
    if (typeof payload.sort_order === 'number') patch.sort_order = payload.sort_order;

    const { data: result, error } = await this.supabaseAdmin
      .from('news_categories')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to update news category (code=${error.code ?? 'unknown'})`);
      this.mapWriteError(error);
    }

    return { oldData, newData: result };
  }

  async delete(id: string) {
    const { data: oldData } = await this.supabaseAdmin
      .from('news_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (!oldData) {
      throw new AppException(ErrorCode.NEWS_CATEGORY_NOT_FOUND, { resource: 'news_category', id }, 'News category not found');
    }

    // Friendly pre-check (the FK ON DELETE RESTRICT is the hard guarantee).
    const { count, error: countError } = await this.supabaseAdmin
      .from('news')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countError) {
      this.logger.warn(`Failed to count news for category (code=${countError.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.NEWS_CATEGORY_OPERATION_FAILED, { resource: 'news_category', id }, 'Failed to delete news category');
    }

    if ((count ?? 0) > 0) {
      throw new AppException(ErrorCode.NEWS_CATEGORY_IN_USE, { resource: 'news_category', id, articles: count });
    }

    const { error } = await this.supabaseAdmin.from('news_categories').delete().eq('id', id);

    if (error) {
      this.logger.warn(`Failed to delete news category (code=${error.code ?? 'unknown'})`);
      this.mapWriteError(error);
    }

    return { oldData };
  }
}
