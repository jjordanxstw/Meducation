/**
 * Profiles Admin Controller
 * Admin management endpoints for profiles
 */

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ProfilesService } from '../services/profiles.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope } from '../../../../common';
import { RefreshTokenService } from '../../auth/services/refresh-token.service';
import { AuditService } from '../../audit/services/audit.service';
import { updateProfileSchema } from '@medical-portal/shared';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe';

@Controller({ path: 'admin/profiles', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class ProfilesAdminController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly audit: AuditService,
  ) {}

  /** GET /api/v1/admin/profiles/:id/sessions — a student's active sign-ins. */
  @Get(':id/sessions')
  @SkipEnvelope()
  async sessions(@Param('id') id: string) {
    const sessions = await this.refreshTokenService.getActiveSessions(id);
    return {
      success: true,
      data: sessions.map((session) => ({
        id: session.id,
        created: session.created_at,
        device: session.device_info?.device || 'unknown',
        browser: session.device_info?.browser || 'unknown',
      })),
    };
  }

  /**
   * POST /api/v1/admin/profiles/:id/revoke-sessions
   * Signs a student out of every device (lost phone, shared account). Their
   * current access token still works until it expires (≤ JWT_EXPIRES_IN).
   */
  @Post(':id/revoke-sessions')
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  async revokeSessions(@Param('id') id: string, @Req() req: any) {
    await this.profilesService.findOne(id);
    const revoked = await this.refreshTokenService.revokeAllUserTokens(id);
    await this.audit.logAdminUpdate('refresh_tokens', id, null, { action: 'revoke_all_sessions', revoked }, req.admin, req);
    return { success: true, data: { revoked } };
  }

  @Get()
  @SkipEnvelope()
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('role') role?: string,
    @Query('year_level') yearLevel?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    // Cursor-based pagination (preferred).
    if (cursor !== undefined || limit !== undefined) {
      const result = await this.profilesService.findAllByCursor({
        cursor,
        limit: limit ? parseInt(limit, 10) : 20,
        role,
        yearLevel: yearLevel ? parseInt(yearLevel, 10) : undefined,
        search,
      });
      return { success: true, data: result.data, meta: result.meta };
    }

    // Legacy offset pagination (deprecated).
    res.setHeader('Deprecation', 'true');
    const result = await this.profilesService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      role,
      yearLevel ? parseInt(yearLevel, 10) : undefined,
      search,
      sortBy,
      sortOrder,
    );
    return { success: true, ...result };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.profilesService.findOne(id);
    return { success: true, data };
  }

  // The admin data provider updates with PUT; PATCH is kept for older callers.
  @Put(':id')
  @Patch(':id')
  @SkipEnvelope()
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) updateDto: any,
    @Req() req: any,
  ) {
    const data = await this.profilesService.update(
      id,
      updateDto,
      req.admin?.id,
      'admin',
    );
    return { success: true, data: data.newData };
  }
}
