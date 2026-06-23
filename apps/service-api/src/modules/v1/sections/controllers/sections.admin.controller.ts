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
  Req,
  UseGuards,
} from '@nestjs/common';
import { SectionsService } from '../services/sections.service';
import { AuditService } from '../../audit/services/audit.service';
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
    private readonly audit: AuditService,
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
  async create(@Body() createDto: any, @Req() req: any) {
    const data = await this.sectionsService.create(createDto);
    await this.audit.logAdminCreate('sections', data?.id, data, req.admin, req);
    this.invalidateSectionGraphCache();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any, @Req() req: any) {
    const data = await this.sectionsService.update(id, updateDto);
    await this.audit.logAdminUpdate('sections', id, data.oldData, data.newData, req.admin, req);
    this.invalidateSectionGraphCache();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string, @Req() req: any) {
    const { oldData } = await this.sectionsService.delete(id);
    await this.audit.logAdminDelete('sections', id, oldData, req.admin, req);
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
