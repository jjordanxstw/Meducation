/**
 * Announcements Module
 * Handles announcement management
 */

import { Module } from '@nestjs/common';
import { AnnouncementsPublicController } from './controllers/announcements.controller';
import { AnnouncementsAdminController } from './controllers/announcements.admin.controller';
import { AnnouncementsService } from './services/announcements.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [AnnouncementsPublicController, AnnouncementsAdminController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
