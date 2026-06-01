/**
 * Team Members Service
 * Business logic for the portal team members shown on the public About Us page.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

const AVATAR_BUCKET = 'team-avatars';

// Minimal shape of a multer file (memoryStorage). Declared locally to avoid a
// dependency on @types/multer; multer itself ships with @nestjs/platform-express.
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
export class TeamMembersService {
  private readonly logger = new Logger(TeamMembersService.name);
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
    const allowed = new Set(['full_name', 'role', 'order_index', 'is_active', 'created_at', 'updated_at']);
    const field = sortBy && allowed.has(sortBy) ? sortBy : 'order_index';
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
   * Public: list active members ordered for the About Us carousel.
   */
  async findAllPublic() {
    const { data, error } = await this.supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.warn(`Failed to fetch team members (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.TEAM_MEMBER_OPERATION_FAILED,
        { resource: 'team member' },
        'Failed to fetch team members',
      );
    }

    return data ?? [];
  }

  /**
   * Admin: list all members with search, sort and pagination.
   */
  async findAll(
    search?: string,
    isActive?: string,
    sortBy?: string,
    sortOrder?: string,
    page?: number,
    pageSize?: number,
  ) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 15));

    let query = this.supabaseAdmin.from('team_members').select('*', { count: 'exact' });

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`full_name.ilike.${term},role.ilike.${term},bio.ilike.${term}`);
    }
    if (isActive !== undefined && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }

    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;
    query = query.range(from, to);

    const sort = this.resolveSort(sortBy, sortOrder);
    const { data, error, count } = await query.order(sort.field, { ascending: sort.ascending });

    if (error) {
      this.logger.warn(`Failed to fetch team members (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.TEAM_MEMBER_OPERATION_FAILED,
        { resource: 'team member' },
        'Failed to fetch team members',
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
   * Admin: get single member.
   */
  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AppException(
        ErrorCode.TEAM_MEMBER_NOT_FOUND,
        { resource: 'team member', id },
        'Team member not found',
      );
    }

    return data;
  }

  /**
   * Admin: create member.
   */
  async create(data: any) {
    const memberData: Record<string, unknown> = {
      full_name: data.full_name,
      role: data.role,
      bio: this.normalizeNullable(data.bio) ?? null,
      avatar_url: this.normalizeNullable(data.avatar_url) ?? null,
      email: this.normalizeNullable(data.email) ?? null,
      linkedin_url: this.normalizeNullable(data.linkedin_url) ?? null,
      github_url: this.normalizeNullable(data.github_url) ?? null,
      instagram_url: this.normalizeNullable(data.instagram_url) ?? null,
      order_index: data.order_index ?? 0,
      is_active: data.is_active ?? true,
    };

    const { data: result, error } = await this.supabaseAdmin
      .from('team_members')
      .insert(memberData)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to create team member (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.TEAM_MEMBER_OPERATION_FAILED,
        { resource: 'team member' },
        'Failed to create team member',
      );
    }

    return result;
  }

  /**
   * Admin: update member.
   */
  async update(id: string, data: any) {
    const existing = await this.findOne(id);

    const updateData: Record<string, unknown> = {};
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.bio !== undefined) updateData.bio = this.normalizeNullable(data.bio);
    if (data.avatar_url !== undefined) updateData.avatar_url = this.normalizeNullable(data.avatar_url);
    if (data.email !== undefined) updateData.email = this.normalizeNullable(data.email);
    if (data.linkedin_url !== undefined) updateData.linkedin_url = this.normalizeNullable(data.linkedin_url);
    if (data.github_url !== undefined) updateData.github_url = this.normalizeNullable(data.github_url);
    if (data.instagram_url !== undefined) updateData.instagram_url = this.normalizeNullable(data.instagram_url);
    if (data.order_index !== undefined) updateData.order_index = data.order_index;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const { data: result, error } = await this.supabaseAdmin
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.warn(`Failed to update team member (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.TEAM_MEMBER_OPERATION_FAILED,
        { resource: 'team member', id },
        'Failed to update team member',
      );
    }

    return { oldData: existing, newData: result };
  }

  /**
   * Admin: delete member.
   */
  async delete(id: string) {
    const existing = await this.findOne(id);

    const { error } = await this.supabaseAdmin.from('team_members').delete().eq('id', id);

    if (error) {
      this.logger.warn(`Failed to delete team member (code=${error.code ?? 'unknown'})`);
      throw new AppException(
        ErrorCode.TEAM_MEMBER_OPERATION_FAILED,
        { resource: 'team member', id },
        'Failed to delete team member',
      );
    }

    return { oldData: existing };
  }

  /**
   * Admin: upload an avatar image to the public `team-avatars` bucket and return
   * its public URL. The service-role key bypasses RLS, so no write policy on the
   * bucket is required.
   */
  async uploadAvatar(file: UploadedImageFile): Promise<{ url: string }> {
    const ext = EXTENSION_BY_MIME[file.mimetype];
    if (!ext) {
      throw new AppException(
        ErrorCode.TEAM_MEMBER_UPLOAD_FAILED,
        { resource: 'team member' },
        'Avatar must be a PNG, JPEG or WebP image',
      );
    }

    const path = `${randomUUID()}.${ext}`;
    const { error } = await this.supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) {
      this.logger.warn(`Failed to upload avatar (${error.message})`);
      throw new AppException(
        ErrorCode.TEAM_MEMBER_UPLOAD_FAILED,
        { resource: 'team member' },
        'Failed to upload avatar image',
      );
    }

    const { data } = this.supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  }
}
