/**
 * Profiles Service
 * Handles user profile business logic
 */

import { Injectable, ForbiddenException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
      this.logger.error('Failed to fetch profiles', error);
      throw new BadRequestException('Failed to fetch profiles');
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
      throw new NotFoundException('Profile not found');
    }

    return data;
  }

  async update(id: string, data: any, requestingUserId?: string, requestingUserRole?: string) {
    // Users can only update their own profile unless admin
    if (requestingUserId !== id && requestingUserRole !== 'admin') {
      throw new ForbiddenException('You can only update your own profile');
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
      this.logger.error('Failed to update profile', error);
      throw new BadRequestException('Failed to update profile');
    }

    return { oldData, newData: result };
  }
}
