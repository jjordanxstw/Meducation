/**
 * Sections Service
 * Handles section business logic
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SectionsService {
  private readonly logger = new Logger(SectionsService.name);
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

  async findAll(subjectId?: string, isActive: boolean = true) {
    let query = this.supabaseAdmin.from('sections').select('*');

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    if (isActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('order_index');

    if (error) {
      this.logger.error('Failed to fetch sections', error);
      throw new BadRequestException('Failed to fetch sections');
    }

    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseAdmin
      .from('sections')
      .select(`*, lectures:lectures(*, resources:resources(*))`)
      .eq('id', id)
      .single();

    if (error) {
      throw new NotFoundException('Section not found');
    }

    return data;
  }

  async create(data: any) {
    const { data: result, error } = await this.supabaseAdmin
      .from('sections')
      .insert(data)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create section', error);
      throw new BadRequestException('Failed to create section');
    }

    return result;
  }

  async update(id: string, data: any) {
    const { data: oldData } = await this.supabaseAdmin
      .from('sections')
      .select('*')
      .eq('id', id)
      .single();

    const { data: result, error } = await this.supabaseAdmin
      .from('sections')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update section', error);
      throw new BadRequestException('Failed to update section');
    }

    return { oldData, newData: result };
  }

  async delete(id: string) {
    const { data: oldData } = await this.supabaseAdmin
      .from('sections')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await this.supabaseAdmin.from('sections').delete().eq('id', id);

    if (error) {
      this.logger.error('Failed to delete section', error);
      throw new BadRequestException('Failed to delete section');
    }

    return { oldData };
  }

  async reorder(items: Array<{ id: string; order_index: number }>) {
    for (const item of items) {
      const { error } = await this.supabaseAdmin
        .from('sections')
        .update({ order_index: item.order_index })
        .eq('id', item.id);

      if (error) {
        this.logger.error('Failed to reorder sections', error);
        throw new BadRequestException('Failed to reorder sections');
      }
    }

    return { message: 'Sections reordered successfully' };
  }
}
