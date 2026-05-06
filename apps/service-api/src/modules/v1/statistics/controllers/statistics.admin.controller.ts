/**
 * Statistics Admin Controller
 * Aggregated statistics endpoints for dashboard
 */

import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SkipEnvelope, ResponseCacheService, applyCacheHeaders } from '../../../../common';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { StatisticsService, ActivityGranularity } from '../services/statistics.service';

const STATISTICS_OVERVIEW_CACHE_TTL_SECONDS = 10;
const STATISTICS_ACTIVITY_CACHE_TTL_SECONDS = 30;
const ALLOWED_GRANULARITIES = new Set<ActivityGranularity>(['day', 'week', 'month']);

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

  @Get('activity')
  @SkipEnvelope()
  async getActivity(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const normalizedGranularity = normalizeGranularity(granularity);
    const cacheKey = `v1:admin:statistics:activity:${from ?? 'default'}:${to ?? 'default'}:${normalizedGranularity}`;

    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: STATISTICS_ACTIVITY_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.statisticsService.getActivityOverTime({
      from,
      to,
      granularity: normalizedGranularity,
    });

    const payload = { success: true, data };
    this.responseCache.set(cacheKey, payload, STATISTICS_ACTIVITY_CACHE_TTL_SECONDS);

    if (res) {
      applyCacheHeaders(res, { ttlSeconds: STATISTICS_ACTIVITY_CACHE_TTL_SECONDS });
    }

    return payload;
  }
}

function normalizeGranularity(value?: string): ActivityGranularity {
  if (!value) {
    return 'day';
  }

  const normalized = value.trim().toLowerCase() as ActivityGranularity;
  return ALLOWED_GRANULARITIES.has(normalized) ? normalized : 'day';
}
