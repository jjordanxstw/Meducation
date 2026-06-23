/**
 * Team Members Admin Controller
 * Admin CRUD + avatar upload for portal team members.
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
import { TeamMembersService, UploadedImageFile } from '../services/team-members.service';
import { AuditService } from '../../audit/services/audit.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope, ResponseCacheService, IdempotencyInterceptor } from '../../../../common';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

const INVALIDATE_TEAM_MEMBER_PREFIXES = ['v1:team-members:'];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

@Controller({ path: 'admin/team-members', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class TeamMembersAdminController {
  constructor(
    private readonly teamMembersService: TeamMembersService,
    private readonly responseCache: ResponseCacheService,
    private readonly audit: AuditService,
  ) {}

  private invalidateTeamMemberCache(): void {
    this.responseCache.deleteByPrefixes(INVALIDATE_TEAM_MEMBER_PREFIXES);
  }

  @Get()
  @SkipEnvelope()
  async findAll(
    @Query('search') search?: string,
    @Query('is_active') isActive?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.teamMembersService.findAll(
      search,
      isActive,
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
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_AVATAR_BYTES } }))
  @SkipEnvelope()
  async uploadAvatar(@UploadedFile() file?: UploadedImageFile) {
    if (!file) {
      throw new AppException(
        ErrorCode.TEAM_MEMBER_UPLOAD_FAILED,
        { resource: 'team member' },
        'No image file provided',
      );
    }
    const data = await this.teamMembersService.uploadAvatar(file);
    return { success: true, data };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.teamMembersService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  @SkipEnvelope()
  async create(@Body() createDto: any, @Req() req: any) {
    const data = await this.teamMembersService.create(createDto);
    await this.audit.logAdminCreate('team_members', data?.id, data, req.admin, req);
    this.invalidateTeamMemberCache();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any, @Req() req: any) {
    const data = await this.teamMembersService.update(id, updateDto);
    await this.audit.logAdminUpdate('team_members', id, data.oldData, data.newData, req.admin, req);
    this.invalidateTeamMemberCache();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string, @Req() req: any) {
    const { oldData } = await this.teamMembersService.delete(id);
    await this.audit.logAdminDelete('team_members', id, oldData, req.admin, req);
    this.invalidateTeamMemberCache();
    return { success: true, message: 'Team member deleted successfully' };
  }
}
