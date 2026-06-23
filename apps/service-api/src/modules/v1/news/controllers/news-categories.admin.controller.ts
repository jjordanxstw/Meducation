/**
 * News Categories Admin Controller
 * Admin CRUD for news categories (name + color). Mirrors EventTypesAdminController.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { NewsCategoriesService } from '../services/news-categories.service';
import { AuditService } from '../../audit/services/audit.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope, ResponseCacheService, IdempotencyInterceptor } from '../../../../common';

// Recoloring/renaming a category changes how articles render, so flush news caches.
const INVALIDATE_NEWS_CATEGORY_PREFIXES = ['v1:news:'];

@Controller({ path: 'admin/news-categories', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class NewsCategoriesAdminController {
  constructor(
    private readonly newsCategoriesService: NewsCategoriesService,
    private readonly responseCache: ResponseCacheService,
    private readonly audit: AuditService,
  ) {}

  private invalidateCaches(): void {
    this.responseCache.deleteByPrefixes(INVALIDATE_NEWS_CATEGORY_PREFIXES);
  }

  @Get()
  @SkipEnvelope()
  async findAll() {
    const data = await this.newsCategoriesService.findAll();
    return {
      success: true,
      data,
      pagination: { page: 1, pageSize: data.length, total: data.length, totalPages: data.length > 0 ? 1 : 0 },
    };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.newsCategoriesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  @SkipEnvelope()
  async create(@Body() createDto: any, @Req() req: any) {
    const data = await this.newsCategoriesService.create(createDto);
    await this.audit.logAdminCreate('news_categories', data?.id, data, req.admin, req);
    this.invalidateCaches();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any, @Req() req: any) {
    const data = await this.newsCategoriesService.update(id, updateDto);
    await this.audit.logAdminUpdate('news_categories', id, data.oldData, data.newData, req.admin, req);
    this.invalidateCaches();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string, @Req() req: any) {
    const { oldData } = await this.newsCategoriesService.delete(id);
    await this.audit.logAdminDelete('news_categories', id, oldData, req.admin, req);
    this.invalidateCaches();
    return { success: true, message: 'News category deleted successfully' };
  }
}
