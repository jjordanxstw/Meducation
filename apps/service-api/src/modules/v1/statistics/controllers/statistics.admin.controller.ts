/**
 * Statistics Admin Controller
 * Aggregated statistics endpoints for dashboard
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkipEnvelope } from '../../../../common';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { StatisticsService } from '../services/statistics.service';

@Controller({ path: 'admin/statistics', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class StatisticsAdminController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @SkipEnvelope()
  async getOverview() {
    const data = await this.statisticsService.getDashboardOverview();
    return { success: true, data };
  }
}
