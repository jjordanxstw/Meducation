/**
 * Learning Resources Admin Controller
 * Admin CRUD + image upload for "Learning Hub" cards.
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
import { LearningResourcesService, UploadedImageFile } from '../services/learning-resources.service';
import { AuditService } from '../../audit/services/audit.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope, ResponseCacheService, IdempotencyInterceptor } from '../../../../common';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

const INVALIDATE_PREFIXES = ['v1:learning-hub:'];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

@Controller({ path: 'admin/learning-resources', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class LearningResourcesAdminController {
  constructor(
    private readonly learningResourcesService: LearningResourcesService,
    private readonly responseCache: ResponseCacheService,
    private readonly audit: AuditService,
  ) {}

  private invalidateCache(): void {
    this.responseCache.deleteByPrefixes(INVALIDATE_PREFIXES);
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
    const result = await this.learningResourcesService.findAll(
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
  @Post('image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  @SkipEnvelope()
  async uploadImage(@UploadedFile() file?: UploadedImageFile) {
    if (!file) {
      throw new AppException(
        ErrorCode.LEARNING_RESOURCE_UPLOAD_FAILED,
        { resource: 'learning_resources' },
        'No image file provided',
      );
    }
    const data = await this.learningResourcesService.uploadImage(file);
    return { success: true, data };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.learningResourcesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  @SkipEnvelope()
  async create(@Body() createDto: any, @Req() req: any) {
    const data = await this.learningResourcesService.create(createDto);
    await this.audit.logAdminCreate('learning_resources', data?.id, data, req.admin, req);
    this.invalidateCache();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any, @Req() req: any) {
    const data = await this.learningResourcesService.update(id, updateDto);
    await this.audit.logAdminUpdate('learning_resources', id, data.oldData, data.newData, req.admin, req);
    this.invalidateCache();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string, @Req() req: any) {
    const { oldData } = await this.learningResourcesService.delete(id);
    await this.audit.logAdminDelete('learning_resources', id, oldData, req.admin, req);
    this.invalidateCache();
    return { success: true, message: 'Learning resource deleted successfully' };
  }
}
