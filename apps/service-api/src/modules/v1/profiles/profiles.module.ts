/**
 * Profiles Module
 * Handles user profile management
 */

import { Module } from '@nestjs/common';
import { ProfilesPublicController } from './controllers/profiles.controller';
import { ProfilesAdminController } from './controllers/profiles.admin.controller';
import { ProfilesService } from './services/profiles.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AdminAuthModule, AuditModule],
  controllers: [ProfilesPublicController, ProfilesAdminController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
