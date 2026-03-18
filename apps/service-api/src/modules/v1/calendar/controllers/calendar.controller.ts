/**
 * Calendar Controller
 * Handles calendar event endpoints
 */

import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CalendarService } from '../services/calendar.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope, ResponseCacheService, buildRequestCacheKey, applyCacheHeaders } from '../../../../common';

const CALENDAR_LIST_CACHE_TTL_SECONDS = 20;
const CALENDAR_MONTH_CACHE_TTL_SECONDS = 30;
const CALENDAR_UPCOMING_CACHE_TTL_SECONDS = 20;
const CALENDAR_DETAIL_CACHE_TTL_SECONDS = 20;

@Controller({ path: 'calendar', version: '1' })
export class CalendarPublicController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('type') type?: string,
    @Query('subject_id') subjectId?: string,
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const cacheKey = buildRequestCacheKey('v1:calendar:list', (req?.query ?? {}) as Record<string, unknown>);
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: CALENDAR_LIST_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.calendarService.findAll(startDate, endDate, type, subjectId);

    const payload = { success: true, data };
    this.responseCache.set(cacheKey, payload, CALENDAR_LIST_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: CALENDAR_LIST_CACHE_TTL_SECONDS });
    }

    return payload;
  }

  @Get('month/:year/:month')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async getByMonth(
    @Param('year') year: string,
    @Param('month') month: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const cacheKey = `v1:calendar:month:${year}:${month}`;
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: CALENDAR_MONTH_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.calendarService.getByMonth(parseInt(year, 10), parseInt(month, 10));
    const payload = { success: true, data };

    this.responseCache.set(cacheKey, payload, CALENDAR_MONTH_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: CALENDAR_MONTH_CACHE_TTL_SECONDS });
    }

    return payload;
  }

  @Get('upcoming')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async getUpcoming(
    @Query('limit') limit?: string,
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const cacheKey = buildRequestCacheKey('v1:calendar:upcoming', (req?.query ?? {}) as Record<string, unknown>);
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: CALENDAR_UPCOMING_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.calendarService.getUpcoming(limit ? parseInt(limit, 10) : 10);
    const payload = { success: true, data };

    this.responseCache.set(cacheKey, payload, CALENDAR_UPCOMING_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: CALENDAR_UPCOMING_CACHE_TTL_SECONDS });
    }

    return payload;
  }

  @Get(':id')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findOne(
    @Param('id') id: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const cacheKey = `v1:calendar:detail:${id}`;
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: CALENDAR_DETAIL_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.calendarService.findOne(id);
    const payload = { success: true, data };

    this.responseCache.set(cacheKey, payload, CALENDAR_DETAIL_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: CALENDAR_DETAIL_CACHE_TTL_SECONDS });
    }

    return payload;
  }
}
