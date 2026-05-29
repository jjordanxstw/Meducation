/**
 * Sections Module
 * Handles section management
 */

import { Module } from '@nestjs/common';
import { SectionsPublicController } from './controllers/sections.controller';
import { SectionsAdminController } from './controllers/sections.admin.controller';
import { SectionsService } from './services/sections.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AdminAuthModule, AuditModule],
  controllers: [SectionsPublicController, SectionsAdminController],
  providers: [SectionsService],
  exports: [SectionsService],
})
export class SectionsModule {}
