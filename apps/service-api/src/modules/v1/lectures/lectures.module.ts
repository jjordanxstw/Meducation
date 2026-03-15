/**
 * Lectures Module
 * Handles lecture management
 */

import { Module } from '@nestjs/common';
import { LecturesPublicController } from './controllers/lectures.controller';
import { LecturesAdminController } from './controllers/lectures.admin.controller';
import { LecturesService } from './services/lectures.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [LecturesPublicController, LecturesAdminController],
  providers: [LecturesService],
  exports: [LecturesService],
})
export class LecturesModule {}
