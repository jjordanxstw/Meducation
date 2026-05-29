/**
 * Audit Admin Controller
 * Admin-only endpoints for audit logs
 */

import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from '../services/audit.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope } from '../../../../common';
import { AuditAction } from '@medical-portal/shared';

@Controller({ path: 'admin/audit-logs', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class AuditAdminController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @SkipEnvelope()
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query('user_id') userId?: string,
    @Query('table_name') tableName?: string,
    @Query('action') action?: AuditAction,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('search') search?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    // Cursor-based pagination (preferred for large datasets).
    if (cursor !== undefined || limit !== undefined) {
      const result = await this.auditService.getLogsByCursor({
        userId,
        tableName,
        action,
        startDate,
        endDate,
        search,
        cursor,
        limit: limit ? parseInt(limit, 10) : 50,
      });
      return { success: true, data: result.data, meta: result.meta };
    }

    // Legacy offset pagination (deprecated).
    res.setHeader('Deprecation', 'true');
    res.setHeader('Link', '</api/v1/admin/audit-logs?cursor=>; rel="successor-version"');
    const result = await this.auditService.getLogs({
      userId,
      tableName,
      action,
      startDate,
      endDate,
      search,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 50,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('tables')
  @SkipEnvelope()
  async getTables() {
    const data = await this.auditService.getTables();
    return { success: true, data };
  }

  @Get('record/:table/:id')
  @SkipEnvelope()
  async getRecordHistory(@Param('table') table: string, @Param('id') id: string) {
    const data = await this.auditService.getRecordHistory(table, id);
    return { success: true, data };
  }
}
