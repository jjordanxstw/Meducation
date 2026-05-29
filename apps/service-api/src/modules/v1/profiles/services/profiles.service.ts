/**
 * Profiles Service
 * Handles user profile business logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';
import { CursorPaginationMeta, encodeCursor, decodeCursor } from '@medical-portal/shared';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);
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

  private mapProfileWriteError(error: { code?: string; message?: string; details?: string | null; hint?: string | null }): never {
    if (error.code === '23505') {
      const signature = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

      if (signature.includes('idx_profiles_email_unique_ci') || signature.includes('profiles_email_key') || signature.includes('(email)')) {
        throw new AppException(ErrorCode.PROFILE_EMAIL_DUPLICATE, { field: 'email' });
      }
      if (signature.includes('idx_profiles_student_id_unique_nonnull') || signature.includes('profiles_student_id_key') || signature.includes('(student_id)')) {
        throw new AppException(ErrorCode.PROFILE_STUDENT_ID_DUPLICATE, { field: 'student_id' });
      }

      throw new AppException(ErrorCode.RESOURCE_CONFLICT, { resource: 'profile' }, 'Duplicate profile data');
    }

    throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'profile' });
  }

  private resolveSort(
    sortBy?: string,
    sortOrder?: string,
  ): { field: string; ascending: boolean } {
    const allowed = new Set(['full_name', 'email', 'student_id', 'year_level', 'role', 'created_at', 'updated_at']);
    const field = sortBy && allowed.has(sortBy) ? sortBy : 'created_at';
    const normalizedOrder = (sortOrder || '').toLowerCase();
    const ascending = normalizedOrder === 'asc' || normalizedOrder === 'ascend';
    return { field, ascending };
  }

  async findAll(
    page: number = 1,
    pageSize: number = 20,
    role?: string,
    yearLevel?: number,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
  ) {
    let query = this.supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }
    if (yearLevel !== undefined) {
      query = query.eq('year_level', yearLevel);
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`full_name.ilike.${term},email.ilike.${term},student_id.ilike.${term}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const sort = this.resolveSort(sortBy, sortOrder);

    const { data, error, count } = await query
      .order(sort.field, { ascending: sort.ascending })
      .range(from, to);

    if (error) {
      this.logger.warn(`Failed to fetch profiles (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'profile' }, 'Failed to fetch profiles');
    }

    return {
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  }

  /**
   * Cursor-based pagination over profiles, keyset-ordered by (created_at, id)
   * descending.
   */
  async findAllByCursor(params: {
    cursor?: string;
    limit: number;
    role?: string;
    yearLevel?: number;
    search?: string;
  }): Promise<{ data: unknown[]; meta: CursorPaginationMeta }> {
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    let query = this.supabaseAdmin.from('profiles').select('*', { count: 'exact' });

    if (params.role) query = query.eq('role', params.role);
    if (params.yearLevel !== undefined) query = query.eq('year_level', params.yearLevel);
    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      query = query.or(`full_name.ilike.${term},email.ilike.${term},student_id.ilike.${term}`);
    }

    if (params.cursor) {
      const decoded = decodeCursor(params.cursor);
      if (!decoded) {
        throw new AppException(ErrorCode.VALIDATION_INVALID_INPUT, { field: 'cursor' }, 'Invalid pagination cursor');
      }
      query = query.or(
        `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`,
      );
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (error) {
      this.logger.warn(`Failed to fetch profiles by cursor (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'profile' }, 'Failed to fetch profiles');
    }

    const rows = (data || []) as Array<Record<string, any>>;
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor = hasMore && last ? encodeCursor({ id: last.id, createdAt: last.created_at }) : null;

    return { data: page, meta: { nextCursor, hasMore, total: count ?? undefined } };
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'profile', id }, 'Profile not found');
    }

    return data;
  }

  async update(id: string, data: any, requestingUserId?: string, requestingUserRole?: string) {
    // Users can only update their own profile unless admin
    if (requestingUserId !== id && requestingUserRole !== 'admin') {
      throw new AppException(ErrorCode.AUTHZ_FORBIDDEN, { resource: 'profile', targetId: id }, 'You can only update your own profile');
    }

    // Get old data for audit
    const { data: oldData } = await this.supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    const { data: result, error } = await this.supabaseAdmin
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to update profile (code=${error.code ?? 'unknown'})`);
      this.mapProfileWriteError(error);
    }

    return { oldData, newData: result };
  }
}
