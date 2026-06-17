/**
 * Learning Resources Public Controller
 * Public (authenticated student) endpoints for published "Learning Hub" cards —
 * the Learning Hub list and the card detail page.
 */

import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { LearningResourcesService } from '../services/learning-resources.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope, ResponseCacheService, buildRequestCacheKey, applyCacheHeaders } from '../../../../common';

const LIST_CACHE_TTL_SECONDS = 60;
const DETAIL_CACHE_TTL_SECONDS = 60;

@Controller({ path: 'learning-hub', version: '1' })
export class LearningResourcesPublicController {
  constructor(
    private readonly learningResourcesService: LearningResourcesService,
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
    const cacheKey = buildRequestCacheKey('v1:learning-hub:list', (req?.query ?? {}) as Record<string, unknown>);
    const cached = this.responseCache.get<{ success: true; data: unknown; pagination: unknown }>(cacheKey);
    if (cached) {
      if (res) applyCacheHeaders(res, { ttlSeconds: LIST_CACHE_TTL_SECONDS });
      return cached;
    }

    const result = await this.learningResourcesService.findAllPublic(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 60,
    );

    const payload = { success: true, ...result };
    this.responseCache.set(cacheKey, payload, LIST_CACHE_TTL_SECONDS);
    if (res) applyCacheHeaders(res, { ttlSeconds: LIST_CACHE_TTL_SECONDS });

    return payload;
  }

  @Get(':id')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findOne(@Param('id') id: string, @Res({ passthrough: true }) res?: Response) {
    const cacheKey = `v1:learning-hub:detail:${id}`;
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) applyCacheHeaders(res, { ttlSeconds: DETAIL_CACHE_TTL_SECONDS });
      return cached;
    }

    const data = await this.learningResourcesService.findOnePublic(id);
    const payload = { success: true, data };

    this.responseCache.set(cacheKey, payload, DETAIL_CACHE_TTL_SECONDS);
    if (res) applyCacheHeaders(res, { ttlSeconds: DETAIL_CACHE_TTL_SECONDS });

    return payload;
  }
}
