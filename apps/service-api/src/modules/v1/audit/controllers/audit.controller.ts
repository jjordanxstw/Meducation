/**
 * Audit Controller
 * Handles audit log endpoints
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { AnyAuthGuard } from '../../../../common';
import { AdminGuard } from '../../auth/guards';
import { Admin } from '../../../../common';
import { SkipEnvelope } from '../../../../common';
import { AuditAction } from '@medical-portal/shared';

@Controller({ path: 'audit-logs', version: '1' })
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @UseGuards(AnyAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async findAll(
    @Query('user_id') userId?: string,
    @Query('table_name') tableName?: string,
    @Query('action') action?: AuditAction,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.auditService.getLogs({
      userId,
      tableName,
      action,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 50,
    });
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('tables')
  @UseGuards(AnyAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async getTables() {
    const data = await this.auditService.getTables();
    return { success: true, data };
  }

  @Get('record/:table/:id')
  @UseGuards(AnyAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async getRecordHistory(@Param('table') table: string, @Param('id') id: string) {
    const data = await this.auditService.getRecordHistory(table, id);
    return { success: true, data };
  }
}
