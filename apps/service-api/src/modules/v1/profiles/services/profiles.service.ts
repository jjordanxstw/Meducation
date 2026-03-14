/**
 * Profiles Service
 * Handles user profile business logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

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

  async findAll(page: number = 1, pageSize: number = 20, role?: string, yearLevel?: number) {
    let query = this.supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }
    if (yearLevel !== undefined) {
      query = query.eq('year_level', yearLevel);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
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
