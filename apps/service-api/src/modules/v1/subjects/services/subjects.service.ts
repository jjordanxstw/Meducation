/**
 * Subjects Service
 * Handles subject business logic
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);
  private readonly supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }
    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async findAll(yearLevel?: number, isActive: boolean = true) {
    let query = this.supabaseAdmin
      .from('subjects')
      .select('*');

    if (yearLevel !== undefined) {
      query = query.eq('year_level', yearLevel);
    }

    if (isActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('order_index');

    if (error) {
      this.logger.error('Failed to fetch subjects', error);
      throw new BadRequestException('Failed to fetch subjects');
    }

    return data;
  }

  async findOne(id: string) {
    // Get subject
    const { data: subject, error: subjectError } = await this.supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (subjectError) {
      throw new NotFoundException('Subject not found');
    }

    // Get sections with lectures and resources
    const { data: sections, error: sectionsError } = await this.supabaseAdmin
      .from('sections')
      .select(`
        *,
        lectures:lectures(
          *,
          resources:resources(*)
        )
      `)
      .eq('subject_id', id)
      .eq('is_active', true)
      .order('order_index');

    if (sectionsError) {
      throw new BadRequestException('Failed to fetch sections');
    }

    // Sort nested data
    const sortedSections = sections?.map(section => ({
      ...section,
      lectures: section.lectures
        ?.filter((l: { is_active: boolean }) => l.is_active)
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
        .map((lecture: { resources: Array<{ is_active: boolean; order_index: number }> }) => ({
          ...lecture,
          resources: lecture.resources
            ?.filter((r: { is_active: boolean }) => r.is_active)
            .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index),
        })),
    }));

    return {
      ...subject,
      sections: sortedSections,
    };
  }

  async create(data: any) {
    const { data: result, error } = await this.supabaseAdmin
      .from('subjects')
      .insert(data)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create subject', error);
      throw new BadRequestException('Failed to create subject');
    }

    return result;
  }

  async update(id: string, data: any) {
    // Get old data for audit
    const { data: oldData } = await this.supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    const { data: result, error } = await this.supabaseAdmin
      .from('subjects')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update subject', error);
      throw new BadRequestException('Failed to update subject');
    }

    return { oldData, newData: result };
  }

  async delete(id: string) {
    // Get old data for audit
    const { data: oldData } = await this.supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await this.supabaseAdmin
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to delete subject', error);
      throw new BadRequestException('Failed to delete subject');
    }

    return { oldData };
  }

  async reorder(items: Array<{ id: string; order_index: number }>) {
    for (const item of items) {
      const { error } = await this.supabaseAdmin
        .from('subjects')
        .update({ order_index: item.order_index })
        .eq('id', item.id);

      if (error) {
        this.logger.error('Failed to reorder subjects', error);
        throw new BadRequestException('Failed to reorder subjects');
      }
    }

    return { message: 'Subjects reordered successfully' };
  }
}
