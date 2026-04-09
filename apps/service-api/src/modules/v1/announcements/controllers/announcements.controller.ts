/**
 * Announcements Public Controller
 * Public endpoints for published announcements
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
import { AnnouncementsService } from '../services/announcements.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope, ResponseCacheService, buildRequestCacheKey, applyCacheHeaders } from '../../../../common';

const ANNOUNCEMENTS_LIST_CACHE_TTL_SECONDS = 30;
const ANNOUNCEMENTS_DETAIL_CACHE_TTL_SECONDS = 30;

@Controller({ path: 'announcements', version: '1' })
export class AnnouncementsPublicController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const cacheKey = buildRequestCacheKey('v1:announcements:list', (req?.query ?? {}) as Record<string, unknown>);
    const cached = this.responseCache.get<{ success: true; data: unknown; pagination: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: ANNOUNCEMENTS_LIST_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const result = await this.announcementsService.findAllPublished(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );

    const payload = { success: true, ...result };
    this.responseCache.set(cacheKey, payload, ANNOUNCEMENTS_LIST_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: ANNOUNCEMENTS_LIST_CACHE_TTL_SECONDS });
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
    const cacheKey = `v1:announcements:detail:${id}`;
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: ANNOUNCEMENTS_DETAIL_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.announcementsService.findOnePublished(id);
    const payload = { success: true, data };

    this.responseCache.set(cacheKey, payload, ANNOUNCEMENTS_DETAIL_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: ANNOUNCEMENTS_DETAIL_CACHE_TTL_SECONDS });
    }

    return payload;
  }
}
