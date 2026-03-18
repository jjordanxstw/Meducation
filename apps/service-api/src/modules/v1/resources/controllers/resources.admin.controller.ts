/**
 * Resources Admin Controller
 * Admin management endpoints for resources
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
import { ResourcesService } from '../services/resources.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope, ResponseCacheService } from '../../../../common';

const INVALIDATE_RESOURCE_PREFIXES = [
  'v1:resources:',
  'v1:lectures:',
  'v1:sections:',
  'v1:subjects:',
  'v1:admin:statistics:',
];

@Controller({ path: 'admin/resources', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class ResourcesAdminController {
  constructor(
    private readonly resourcesService: ResourcesService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  private invalidateResourceGraphCache(): void {
    this.responseCache.deleteByPrefixes(INVALIDATE_RESOURCE_PREFIXES);
  }

  @Get()
  @SkipEnvelope()
  async findAll(
    @Query('subject_id') subjectId?: string,
    @Query('lecture_id') lectureId?: string,
    @Query('section_id') sectionId?: string,
    @Query('type') type?: string,
    @Query('is_active') isActive?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.resourcesService.findAll(
      subjectId,
      sectionId,
      lectureId,
      type,
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
    const data = await this.resourcesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.resourcesService.create(createDto);
    this.invalidateResourceGraphCache();
    return { success: true, data };
  }

  @Post('full-create')
  @SkipEnvelope()
  async fullCreate(@Body() payload: any) {
    const data = await this.resourcesService.fullCreate(payload);
    this.invalidateResourceGraphCache();
    return { success: true, data };
  }

  @Post('bulk')
  @SkipEnvelope()
  async bulkCreate(@Body() body: { resources: any[] }) {
    const data = await this.resourcesService.bulkCreate(body.resources);
    this.invalidateResourceGraphCache();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.resourcesService.update(id, updateDto);
    this.invalidateResourceGraphCache();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.resourcesService.delete(id);
    this.invalidateResourceGraphCache();
    return { success: true, message: 'Resource deleted successfully' };
  }

  @Patch('reorder')
  @SkipEnvelope()
  async reorder(@Body() body: { items: Array<{ id: string; order_index: number }> }) {
    const result = await this.resourcesService.reorder(body.items);
    this.invalidateResourceGraphCache();
    return { success: true, ...result };
  }
}
