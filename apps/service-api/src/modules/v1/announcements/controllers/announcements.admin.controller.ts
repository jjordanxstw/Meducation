/**
 * Announcements Admin Controller
 * Admin management endpoints for announcements
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AnnouncementsService } from '../services/announcements.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope, ResponseCacheService } from '../../../../common';

const INVALIDATE_ANNOUNCEMENT_PREFIXES = ['v1:announcements:'];

@Controller({ path: 'admin/announcements', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class AnnouncementsAdminController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  private invalidateAnnouncementCache(): void {
    this.responseCache.deleteByPrefixes(INVALIDATE_ANNOUNCEMENT_PREFIXES);
  }

  @Get()
  @SkipEnvelope()
  async findAll(
    @Query('search') search?: string,
    @Query('is_published') isPublished?: string,
    @Query('is_pinned') isPinned?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.announcementsService.findAll(
      search,
      isPublished,
      isPinned,
      sortBy,
      sortOrder,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 15,
    );

    return { success: true, ...result };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.announcementsService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @SkipEnvelope()
  async create(@Body() createDto: any, @Req() req: any) {
    const data = await this.announcementsService.create(createDto, req.admin?.id);
    this.invalidateAnnouncementCache();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.announcementsService.update(id, updateDto);
    this.invalidateAnnouncementCache();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.announcementsService.delete(id);
    this.invalidateAnnouncementCache();
    return { success: true, message: 'Announcement deleted successfully' };
  }
}
