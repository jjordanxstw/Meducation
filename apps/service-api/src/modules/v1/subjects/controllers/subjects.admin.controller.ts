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
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubjectsService, UploadedImageFile } from '../services/subjects.service';
import { AppException } from '../../../../common/errors';
import { AuditService } from '../../audit/services/audit.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope, ResponseCacheService, IdempotencyInterceptor, ZodValidationPipe } from '../../../../common';
import { createSubjectSchema, CreateSubjectInput, ErrorCode } from '@medical-portal/shared';

const MAX_SUBJECT_IMAGE_BYTES = 1 * 1024 * 1024; // 1 MB

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
    private readonly audit: AuditService,
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

  // Multipart upload. Note: multipart bypasses the global express.json({ limit })
  // body parser, so the small JSON cap does not apply; multer enforces the size
  // limit below. Default (memory) storage populates file.buffer.
  @Post('image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SUBJECT_IMAGE_BYTES } }))
  @SkipEnvelope()
  async uploadImage(@UploadedFile() file?: UploadedImageFile) {
    if (!file) {
      throw new AppException(
        ErrorCode.RESOURCE_OPERATION_FAILED,
        { resource: 'subject' },
        'No image file provided',
      );
    }
    const data = await this.subjectsService.uploadImage(file);
    return { success: true, data };
  }

  // Full editable hierarchy (includes inactive sections/lectures/resources) for
  // the unified tree editor. Declared before ':id' so it matches first.
  @Get(':id/tree')
  @SkipEnvelope()
  async findOneTree(@Param('id') id: string) {
    const data = await this.subjectsService.findOneForEdit(id);
    return { success: true, data };
  }

  // Atomic save of the whole subject tree (subject fields + sections/lectures/resources).
  @Put(':id/tree')
  @SkipEnvelope()
  async saveTree(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const data = await this.subjectsService.saveTree(id, body);
    // Log a single compact UPDATE (the RPC's per-level counts) — the main path for
    // editing the curriculum. Avoids storing the whole tree to keep audit_logs small.
    await this.audit.logAdminUpdate('subjects', id, null, data, req.admin, req);
    this.invalidateSubjectGraphCache();
    return { success: true, data };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.subjectsService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  @SkipEnvelope()
  async create(@Body(new ZodValidationPipe(createSubjectSchema)) createDto: CreateSubjectInput, @Req() req: any) {
    const data = await this.subjectsService.create(createDto);
    await this.audit.logAdminCreate('subjects', data?.id, data, req.admin, req);
    this.invalidateSubjectGraphCache();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any, @Req() req: any) {
    const data = await this.subjectsService.update(id, updateDto);
    await this.audit.logAdminUpdate('subjects', id, data.oldData, data.newData, req.admin, req);
    this.invalidateSubjectGraphCache();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string, @Req() req: any) {
    const { oldData } = await this.subjectsService.delete(id);
    await this.audit.logAdminDelete('subjects', id, oldData, req.admin, req);
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
