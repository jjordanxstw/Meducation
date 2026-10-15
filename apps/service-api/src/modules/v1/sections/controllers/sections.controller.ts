/**
 * Sections Controller
 * Handles section endpoints
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
import { SectionsService } from '../services/sections.service';
import { GoogleAuthGuard } from '../../auth/guards';
import {
  SkipEnvelope,
  ResponseCacheService,
  buildRequestCacheKey,
  applyCacheHeaders,
  CONTENT_SERVER_CACHE_TTL_SECONDS,
} from '../../../../common';

const SECTION_LIST_CACHE_TTL_SECONDS = 20;
const SECTION_DETAIL_CACHE_TTL_SECONDS = 30;

@Controller({ path: 'sections', version: '1' })
export class SectionsPublicController {
  constructor(
    private readonly sectionsService: SectionsService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('subject_id') subjectId?: string,
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const cacheKey = buildRequestCacheKey('v1:sections:list', (req?.query ?? {}) as Record<string, unknown>, ['subject_id']);
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: SECTION_LIST_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.sectionsService.findAllForStudent(subjectId);

    const payload = { success: true, data };
    this.responseCache.set(cacheKey, payload, CONTENT_SERVER_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: SECTION_LIST_CACHE_TTL_SECONDS });
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
    const cacheKey = `v1:sections:detail:${id}`;
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: SECTION_DETAIL_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.sectionsService.findOneForStudent(id);
    const payload = { success: true, data };

    this.responseCache.set(cacheKey, payload, CONTENT_SERVER_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: SECTION_DETAIL_CACHE_TTL_SECONDS });
    }

    return payload;
  }
}
