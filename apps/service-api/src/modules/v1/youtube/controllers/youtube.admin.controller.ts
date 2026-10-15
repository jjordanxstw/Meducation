/**
 * YouTube Admin Controller
 * Resolves playlist / video links for the subject tree's playlist importer.
 */

import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { SkipEnvelope } from '../../../../common';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { YoutubeService } from '../services/youtube.service';
import { youtubeResolveSchema } from '@medical-portal/shared';
import { ZodValidationPipe } from '../../../../common/pipes/zod-validation.pipe';

@Controller({ path: 'admin/youtube', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class YoutubeAdminController {
  constructor(private readonly youtubeService: YoutubeService) {}

  /** POST /api/v1/admin/youtube/resolve  { input: "<playlist link or video links>" } */
  @Post('resolve')
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  async resolve(@Body(new ZodValidationPipe(youtubeResolveSchema)) body: { input?: unknown }) {
    const data = await this.youtubeService.resolve(body.input as string);
    return { success: true, data };
  }
}
