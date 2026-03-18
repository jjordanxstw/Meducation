/**
 * Statistics Admin Controller
 * Aggregated statistics endpoints for dashboard
 */

import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SkipEnvelope, ResponseCacheService, applyCacheHeaders } from '../../../../common';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { StatisticsService } from '../services/statistics.service';

const STATISTICS_OVERVIEW_CACHE_TTL_SECONDS = 10;

@Controller({ path: 'admin/statistics', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class StatisticsAdminController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  @Get('overview')
  @SkipEnvelope()
  async getOverview(@Res({ passthrough: true }) res?: Response) {
    const cacheKey = 'v1:admin:statistics:overview';
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: STATISTICS_OVERVIEW_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.statisticsService.getDashboardOverview();
    const payload = { success: true, data };

    this.responseCache.set(cacheKey, payload, STATISTICS_OVERVIEW_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: STATISTICS_OVERVIEW_CACHE_TTL_SECONDS });
    }

    return payload;
  }
}
