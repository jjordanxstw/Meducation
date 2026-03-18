/**
 * Resources Controller
 * Handles resource endpoints
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
import { ResourcesService } from '../services/resources.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope, ResponseCacheService, buildRequestCacheKey, applyCacheHeaders } from '../../../../common';

const RESOURCE_LIST_CACHE_TTL_SECONDS = 20;
const RESOURCE_DETAIL_CACHE_TTL_SECONDS = 30;

@Controller({ path: 'resources', version: '1' })
export class ResourcesPublicController {
  constructor(
    private readonly resourcesService: ResourcesService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('subject_id') subjectId?: string,
    @Query('section_id') sectionId?: string,
    @Query('lecture_id') lectureId?: string,
    @Query('type') type?: string,
    @Query('is_active') isActive?: string,
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const cacheKey = buildRequestCacheKey('v1:resources:list', (req?.query ?? {}) as Record<string, unknown>);
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: RESOURCE_LIST_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.resourcesService.findAll(
      subjectId,
      sectionId,
      lectureId,
      type,
      isActive === 'false' ? false : true,
    );

    const payload = { success: true, data };
    this.responseCache.set(cacheKey, payload, RESOURCE_LIST_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: RESOURCE_LIST_CACHE_TTL_SECONDS });
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
    const cacheKey = `v1:resources:detail:${id}`;
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: RESOURCE_DETAIL_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.resourcesService.findOne(id);
    const payload = { success: true, data };

    this.responseCache.set(cacheKey, payload, RESOURCE_DETAIL_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: RESOURCE_DETAIL_CACHE_TTL_SECONDS });
    }

    return payload;
  }
}
