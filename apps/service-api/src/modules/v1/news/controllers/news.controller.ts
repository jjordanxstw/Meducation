/**
 * News Public Controller
 * Public (authenticated student) endpoints for published "Hot News" articles —
 * the home dashboard list and the article detail page.
 */

import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { NewsService } from '../services/news.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope, ResponseCacheService, buildRequestCacheKey, applyCacheHeaders } from '../../../../common';

const NEWS_LIST_CACHE_TTL_SECONDS = 60;
const NEWS_DETAIL_CACHE_TTL_SECONDS = 60;

@Controller({ path: 'news', version: '1' })
export class NewsPublicController {
  constructor(
    private readonly newsService: NewsService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: string,
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const cacheKey = buildRequestCacheKey('v1:news:list', (req?.query ?? {}) as Record<string, unknown>);
    const cached = this.responseCache.get<{ success: true; data: unknown; pagination: unknown }>(cacheKey);
    if (cached) {
      if (res) applyCacheHeaders(res, { ttlSeconds: NEWS_LIST_CACHE_TTL_SECONDS });
      return cached;
    }

    const result = await this.newsService.findAllPublic(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 12,
      category,
    );

    const payload = { success: true, ...result };
    this.responseCache.set(cacheKey, payload, NEWS_LIST_CACHE_TTL_SECONDS);
    if (res) applyCacheHeaders(res, { ttlSeconds: NEWS_LIST_CACHE_TTL_SECONDS });

    return payload;
  }

  @Get(':id')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findOne(@Param('id') id: string, @Res({ passthrough: true }) res?: Response) {
    const cacheKey = `v1:news:detail:${id}`;
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) applyCacheHeaders(res, { ttlSeconds: NEWS_DETAIL_CACHE_TTL_SECONDS });
      return cached;
    }

    const data = await this.newsService.findOnePublic(id);
    const payload = { success: true, data };

    this.responseCache.set(cacheKey, payload, NEWS_DETAIL_CACHE_TTL_SECONDS);
    if (res) applyCacheHeaders(res, { ttlSeconds: NEWS_DETAIL_CACHE_TTL_SECONDS });

    return payload;
  }
}
