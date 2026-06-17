/**
 * Learning Resources Module
 * Public "Learning Hub" listing + detail and admin CRUD with image upload.
 */

import { Module } from '@nestjs/common';
import { LearningResourcesPublicController } from './controllers/learning-resources.controller';
import { LearningResourcesAdminController } from './controllers/learning-resources.admin.controller';
import { LearningResourcesService } from './services/learning-resources.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AdminAuthModule, AuditModule],
  controllers: [LearningResourcesPublicController, LearningResourcesAdminController],
  providers: [LearningResourcesService],
  exports: [LearningResourcesService],
})
export class LearningResourcesModule {}
