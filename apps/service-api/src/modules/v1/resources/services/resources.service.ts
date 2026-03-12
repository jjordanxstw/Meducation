/**
 * Resources Service
 * Handles resource business logic
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);
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

  async findAll(lectureId?: string, type?: string, isActive: boolean = true) {
    let query = this.supabaseAdmin.from('resources').select('*');

    if (lectureId) {
      query = query.eq('lecture_id', lectureId);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (isActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('order_index');

    if (error) {
      this.logger.error('Failed to fetch resources', error);
      throw new BadRequestException('Failed to fetch resources');
    }

    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new NotFoundException('Resource not found');
    }

    return data;
  }

  async create(data: any) {
    const { data: result, error } = await this.supabaseAdmin
      .from('resources')
      .insert(data)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create resource', error);
      throw new BadRequestException('Failed to create resource');
    }

    return result;
  }

  async bulkCreate(resources: any[]) {
    const { data, error } = await this.supabaseAdmin
      .from('resources')
      .insert(resources)
      .select();

    if (error) {
      this.logger.error('Failed to create resources', error);
      throw new BadRequestException('Failed to create resources');
    }

    return data;
  }

  async update(id: string, data: any) {
    const { data: oldData } = await this.supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    const { data: result, error } = await this.supabaseAdmin
      .from('resources')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update resource', error);
      throw new BadRequestException('Failed to update resource');
    }

    return { oldData, newData: result };
  }

  async delete(id: string) {
    const { data: oldData } = await this.supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await this.supabaseAdmin.from('resources').delete().eq('id', id);

    if (error) {
      this.logger.error('Failed to delete resource', error);
      throw new BadRequestException('Failed to delete resource');
    }

    return { oldData };
  }

  async reorder(items: Array<{ id: string; order_index: number }>) {
    for (const item of items) {
      const { error } = await this.supabaseAdmin
        .from('resources')
        .update({ order_index: item.order_index })
        .eq('id', item.id);

      if (error) {
        this.logger.error('Failed to reorder resources', error);
        throw new BadRequestException('Failed to reorder resources');
      }
    }

    return { message: 'Resources reordered successfully' };
  }
}
