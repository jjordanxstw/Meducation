/**
 * Team Members Public Controller
 * Public (authenticated student) endpoint backing the About Us page.
 */

import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TeamMembersService } from '../services/team-members.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope, ResponseCacheService, buildRequestCacheKey, applyCacheHeaders } from '../../../../common';

const TEAM_MEMBERS_LIST_CACHE_TTL_SECONDS = 60;

@Controller({ path: 'team-members', version: '1' })
export class TeamMembersPublicController {
  constructor(
    private readonly teamMembersService: TeamMembersService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const cacheKey = buildRequestCacheKey('v1:team-members:list', (req?.query ?? {}) as Record<string, unknown>);
    const cached = this.responseCache.get<{ success: true; data: unknown }>(cacheKey);
    if (cached) {
      if (res) {
        applyCacheHeaders(res, { ttlSeconds: TEAM_MEMBERS_LIST_CACHE_TTL_SECONDS });
      }
      return cached;
    }

    const data = await this.teamMembersService.findAllPublic();
    const payload = { success: true, data };

    this.responseCache.set(cacheKey, payload, TEAM_MEMBERS_LIST_CACHE_TTL_SECONDS);
    if (res) {
      applyCacheHeaders(res, { ttlSeconds: TEAM_MEMBERS_LIST_CACHE_TTL_SECONDS });
    }

    return payload;
  }
}
