/**
 * News Admin Controller
 * Admin CRUD + cover image upload for "Hot News" articles.
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NewsService, UploadedImageFile } from '../services/news.service';
import { AuditService } from '../../audit/services/audit.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope, ResponseCacheService, IdempotencyInterceptor } from '../../../../common';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

const INVALIDATE_NEWS_PREFIXES = ['v1:news:'];
const MAX_COVER_BYTES = 4 * 1024 * 1024; // 4 MB

@Controller({ path: 'admin/news', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class NewsAdminController {
  constructor(
    private readonly newsService: NewsService,
    private readonly responseCache: ResponseCacheService,
    private readonly audit: AuditService,
  ) {}

  private invalidateNewsCache(): void {
    this.responseCache.deleteByPrefixes(INVALIDATE_NEWS_PREFIXES);
  }

  @Get()
  @SkipEnvelope()
  async findAll(
    @Query('search') search?: string,
    @Query('is_published') isPublished?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.newsService.findAll(
      search,
      isPublished,
      sortBy,
      sortOrder,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 15,
    );

    return { success: true, ...result };
  }

  // Multipart upload. Note: multipart bypasses the global express.json({ limit })
  // body parser, so the small JSON cap does not apply here; multer enforces the
  // size limit below. Default (memory) storage populates file.buffer.
  @Post('cover')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_COVER_BYTES } }))
  @SkipEnvelope()
  async uploadCover(@UploadedFile() file?: UploadedImageFile) {
    if (!file) {
      throw new AppException(ErrorCode.NEWS_UPLOAD_FAILED, { resource: 'news' }, 'No image file provided');
    }
    const data = await this.newsService.uploadCover(file);
    return { success: true, data };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.newsService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.newsService.create(createDto);
    this.invalidateNewsCache();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.newsService.update(id, updateDto);
    this.invalidateNewsCache();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string, @Req() req: any) {
    const { oldData } = await this.newsService.delete(id);
    await this.audit.logAdminDelete('news', id, oldData, req.admin, req);
    this.invalidateNewsCache();
    return { success: true, message: 'News article deleted successfully' };
  }
}
