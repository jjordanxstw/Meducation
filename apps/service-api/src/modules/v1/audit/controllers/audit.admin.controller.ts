/**
 * Audit Admin Controller
 * Admin-only endpoints for audit logs
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
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
    @Query('user_id') userId?: string,
    @Query('table_name') tableName?: string,
    @Query('action') action?: AuditAction,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
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
