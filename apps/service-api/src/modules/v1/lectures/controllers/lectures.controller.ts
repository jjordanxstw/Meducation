/**
 * Lectures Controller
 * Handles lecture endpoints
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
import { LecturesService } from '../services/lectures.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope, ResponseCacheService, buildRequestCacheKey, applyCacheHeaders } from '../../../../common';

const LECTURE_LIST_CACHE_TTL_SECONDS = 20;
const LECTURE_DETAIL_CACHE_TTL_SECONDS = 30;

@Controller({ path: 'lectures', version: '1' })
export class LecturesPublicController {
  constructor(
    private readonly lecturesService: LecturesService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('subject_id') subjectId?: string,
    @Query('section_id') sectionId?: string,
    @Query('is_active') isActive?: string,
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const cacheKey = buildRequestCacheKey('v1:lectures:list', (req?.query ?? {}) as Record<string, unknown>);
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: LECTURE_LIST_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.lecturesService.findAll(
      subjectId,
      sectionId,
      isActive === 'false' ? false : true,
    );

    const payload = { success: true, data };
    this.responseCache.set(cacheKey, payload, LECTURE_LIST_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: LECTURE_LIST_CACHE_TTL_SECONDS });
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
    const cacheKey = `v1:lectures:detail:${id}`;
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: LECTURE_DETAIL_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.lecturesService.findOne(id);
    const payload = { success: true, data };

    this.responseCache.set(cacheKey, payload, LECTURE_DETAIL_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: LECTURE_DETAIL_CACHE_TTL_SECONDS });
    }

    return payload;
  }
}
