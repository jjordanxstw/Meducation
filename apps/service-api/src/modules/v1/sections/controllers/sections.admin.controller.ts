/**
 * Sections Admin Controller
 * Admin management endpoints for sections
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
import { SectionsService } from '../services/sections.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope, ResponseCacheService } from '../../../../common';

const INVALIDATE_SECTION_GRAPH_PREFIXES = [
  'v1:sections:',
  'v1:lectures:',
  'v1:resources:',
  'v1:calendar:',
  'v1:admin:statistics:',
];

@Controller({ path: 'admin/sections', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class SectionsAdminController {
  constructor(
    private readonly sectionsService: SectionsService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  private invalidateSectionGraphCache(): void {
    this.responseCache.deleteByPrefixes(INVALIDATE_SECTION_GRAPH_PREFIXES);
  }

  @Get()
  @SkipEnvelope()
  async findAll(
    @Query('subject_id') subjectId?: string,
    @Query('is_active') isActive?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.sectionsService.findAll(
      subjectId,
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
    const data = await this.sectionsService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.sectionsService.create(createDto);
    this.invalidateSectionGraphCache();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.sectionsService.update(id, updateDto);
    this.invalidateSectionGraphCache();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.sectionsService.delete(id);
    this.invalidateSectionGraphCache();
    return { success: true, message: 'Section deleted successfully' };
  }

  @Patch('reorder')
  @SkipEnvelope()
  async reorder(@Body() body: { items: Array<{ id: string; order_index: number }> }) {
    const result = await this.sectionsService.reorder(body.items);
    this.invalidateSectionGraphCache();
    return { success: true, ...result };
  }
}
