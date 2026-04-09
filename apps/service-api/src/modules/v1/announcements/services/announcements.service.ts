/**
 * Announcements Service
 * Handles announcement business logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);
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

  private resolveSort(
    sortBy?: string,
    sortOrder?: string,
  ): { field: string; ascending: boolean } {
    const allowed = new Set(['title', 'is_pinned', 'is_published', 'created_at', 'updated_at']);
    const field = sortBy && allowed.has(sortBy) ? sortBy : 'created_at';
    const normalizedOrder = (sortOrder || '').toLowerCase();
    const ascending = normalizedOrder === 'asc' || normalizedOrder === 'ascend';
    return { field, ascending };
  }

  /**
   * Public: list published announcements, pinned first
   */
  async findAllPublished(page: number = 1, pageSize: number = 10) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 10));

    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    const { data, error, count } = await this.supabaseAdmin
      .from('announcements')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      this.logger.warn(`Failed to fetch published announcements (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.ANNOUNCEMENT_OPERATION_FAILED,
        { resource: 'announcement' },
        'Failed to fetch announcements',
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
   * Public: get single published announcement
   */
  async findOnePublished(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('announcements')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      throw new AppException(
        ErrorCode.ANNOUNCEMENT_NOT_FOUND,
        { resource: 'announcement', id },
        'Announcement not found',
      );
    }

    return data;
  }

  /**
   * Admin: list all announcements with filters and pagination
   */
  async findAll(
    search?: string,
    isPublished?: string,
    isPinned?: string,
    sortBy?: string,
    sortOrder?: string,
    page?: number,
    pageSize?: number,
  ) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 15));

    let query = this.supabaseAdmin
      .from('announcements')
      .select('*', { count: 'exact' });

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`title.ilike.${term},content.ilike.${term}`);
    }
    if (isPublished !== undefined && isPublished !== '') {
      query = query.eq('is_published', isPublished === 'true');
    }
    if (isPinned !== undefined && isPinned !== '') {
      query = query.eq('is_pinned', isPinned === 'true');
    }

    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;
    query = query.range(from, to);

    const sort = this.resolveSort(sortBy, sortOrder);
    const { data, error, count } = await query
      .order('is_pinned', { ascending: false })
      .order(sort.field, { ascending: sort.ascending });

    if (error) {
      this.logger.warn(`Failed to fetch announcements (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.ANNOUNCEMENT_OPERATION_FAILED,
        { resource: 'announcement' },
        'Failed to fetch announcements',
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
   * Admin: get single announcement (no published filter)
   */
  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AppException(
        ErrorCode.ANNOUNCEMENT_NOT_FOUND,
        { resource: 'announcement', id },
        'Announcement not found',
      );
    }

    return data;
  }

  /**
   * Admin: create announcement
   */
  async create(data: any, createdByAdminId: string) {
    const announcementData: Record<string, unknown> = {
      title: data.title,
      content: data.content,
      is_pinned: data.is_pinned ?? false,
      is_published: data.is_published ?? true,
      created_by_admin: createdByAdminId,
    };

    const { data: result, error } = await this.supabaseAdmin
      .from('announcements')
      .insert(announcementData)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to create announcement (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.ANNOUNCEMENT_OPERATION_FAILED,
        { resource: 'announcement' },
        'Failed to create announcement',
      );
    }

    return result;
  }

  /**
   * Admin: update announcement
   */
  async update(id: string, data: any) {
    const existing = await this.findOne(id);

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.is_pinned !== undefined) updateData.is_pinned = data.is_pinned;
    if (data.is_published !== undefined) updateData.is_published = data.is_published;

    const { data: result, error } = await this.supabaseAdmin
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to update announcement (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.ANNOUNCEMENT_OPERATION_FAILED,
        { resource: 'announcement', id },
        'Failed to update announcement',
      );
    }

    return { oldData: existing, newData: result };
  }

  /**
   * Admin: delete announcement
   */
  async delete(id: string) {
    const existing = await this.findOne(id);

    const { error } = await this.supabaseAdmin
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.warn(`Failed to delete announcement (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.ANNOUNCEMENT_OPERATION_FAILED,
        { resource: 'announcement', id },
        'Failed to delete announcement',
      );
    }

    return { oldData: existing };
  }
}
