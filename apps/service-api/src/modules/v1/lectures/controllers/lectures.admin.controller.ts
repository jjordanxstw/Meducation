/**
 * Lectures Admin Controller
 * Admin management endpoints for lectures
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LecturesService } from '../services/lectures.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope, ResponseCacheService } from '../../../../common';

const INVALIDATE_LECTURE_GRAPH_PREFIXES = [
  'v1:lectures:',
  'v1:resources:',
  'v1:calendar:',
  'v1:admin:statistics:',
];

@Controller({ path: 'admin/lectures', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class LecturesAdminController {
  constructor(
    private readonly lecturesService: LecturesService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  private invalidateLectureGraphCache(): void {
    this.responseCache.deleteByPrefixes(INVALIDATE_LECTURE_GRAPH_PREFIXES);
  }

  @Get()
  @SkipEnvelope()
  async findAll(
    @Query('subject_id') subjectId?: string,
    @Query('section_id') sectionId?: string,
    @Query('is_active') isActive?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.lecturesService.findAll(
      subjectId,
      sectionId,
      isActive === 'false' ? false : true,
      search,
      sortBy,
      sortOrder,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 15,
    );

    const data = Array.isArray(result) ? result : result.data;
    const pagination = Array.isArray(result)
      ? {
          page: 1,
          pageSize: data.length,
          total: data.length,
          totalPages: data.length > 0 ? 1 : 0,
        }
      : result.pagination;

    return { success: true, data, pagination };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.lecturesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.lecturesService.create(createDto);
    this.invalidateLectureGraphCache();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.lecturesService.update(id, updateDto);
    this.invalidateLectureGraphCache();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.lecturesService.delete(id);
    this.invalidateLectureGraphCache();
    return { success: true, message: 'Lecture deleted successfully' };
  }

  @Patch('reorder')
  @SkipEnvelope()
  async reorder(@Body() body: { items: Array<{ id: string; order_index: number }> }) {
    const result = await this.lecturesService.reorder(body.items);
    this.invalidateLectureGraphCache();
    return { success: true, ...result };
  }
}
