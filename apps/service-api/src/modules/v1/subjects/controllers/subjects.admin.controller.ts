/**
 * Subjects Admin Controller
 * Admin management endpoints for subjects
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
import { SubjectsService } from '../services/subjects.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope, ResponseCacheService } from '../../../../common';

const INVALIDATE_SUBJECT_GRAPH_PREFIXES = [
  'v1:subjects:',
  'v1:sections:',
  'v1:lectures:',
  'v1:resources:',
  'v1:calendar:',
  'v1:admin:statistics:',
];

@Controller({ path: 'admin/subjects', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class SubjectsAdminController {
  constructor(
    private readonly subjectsService: SubjectsService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  private invalidateSubjectGraphCache(): void {
    this.responseCache.deleteByPrefixes(INVALIDATE_SUBJECT_GRAPH_PREFIXES);
  }

  @Get()
  @SkipEnvelope()
  async findAll(
    @Query('year_level') yearLevel?: string,
    @Query('is_active') isActive?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.subjectsService.findAll(
      yearLevel ? parseInt(yearLevel, 10) : undefined,
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
    const data = await this.subjectsService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.subjectsService.create(createDto);
    this.invalidateSubjectGraphCache();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.subjectsService.update(id, updateDto);
    this.invalidateSubjectGraphCache();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.subjectsService.delete(id);
    this.invalidateSubjectGraphCache();
    return { success: true, message: 'Subject deleted successfully' };
  }

  @Patch('reorder')
  @SkipEnvelope()
  async reorder(@Body() body: { items: Array<{ id: string; order_index: number }> }) {
    const result = await this.subjectsService.reorder(body.items);
    this.invalidateSubjectGraphCache();
    return { success: true, ...result };
  }
}
