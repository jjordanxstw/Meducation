/**
 * YouTube Module
 * Admin-only helpers for importing lecture recordings from YouTube.
 */

import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { YoutubeAdminController } from './controllers/youtube.admin.controller';
import { YoutubeService } from './services/youtube.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [YoutubeAdminController],
  providers: [YoutubeService],
})
export class YoutubeModule {}
