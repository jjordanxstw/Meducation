/**
 * Subjects Controller
 * Handles subject endpoints
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
import { SubjectsService } from '../services/subjects.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope, ResponseCacheService, buildRequestCacheKey, applyCacheHeaders } from '../../../../common';

const SUBJECT_LIST_CACHE_TTL_SECONDS = 20;
const SUBJECT_DETAIL_CACHE_TTL_SECONDS = 30;

@Controller({ path: 'subjects', version: '1' })
export class SubjectsPublicController {
  constructor(
    private readonly subjectsService: SubjectsService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  /**
   * GET /api/v1/subjects
    * Public read endpoint for subjects
   */
  @Get()
    @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('year_level') yearLevel?: string,
    @Query('is_active') isActive?: string,
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const cacheKey = buildRequestCacheKey('v1:subjects:list', (req?.query ?? {}) as Record<string, unknown>);
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: SUBJECT_LIST_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.subjectsService.findAll(
      yearLevel ? parseInt(yearLevel, 10) : undefined,
      isActive === 'false' ? false : true,
    );

    const payload = {
      success: true,
      data,
    };

    this.responseCache.set(cacheKey, payload, SUBJECT_LIST_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: SUBJECT_LIST_CACHE_TTL_SECONDS });
    }

    return payload;
  }

  /**
   * GET /api/v1/subjects/:id
    * Public read endpoint for subject detail and hierarchy
   */
  @Get(':id')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findOne(
    @Param('id') id: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const cacheKey = `v1:subjects:detail:${id}`;
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: SUBJECT_DETAIL_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.subjectsService.findOne(id);

    const payload = {
      success: true,
      data,
    };

    this.responseCache.set(cacheKey, payload, SUBJECT_DETAIL_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: SUBJECT_DETAIL_CACHE_TTL_SECONDS });
    }

    return payload;
  }
}
