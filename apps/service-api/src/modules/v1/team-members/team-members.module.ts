/**
 * Team Members Module
 * Public About Us listing + admin CRUD with avatar upload.
 */

import { Module } from '@nestjs/common';
import { TeamMembersPublicController } from './controllers/team-members.controller';
import { TeamMembersAdminController } from './controllers/team-members.admin.controller';
import { TeamMembersService } from './services/team-members.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AdminAuthModule, AuditModule],
  controllers: [TeamMembersPublicController, TeamMembersAdminController],
  providers: [TeamMembersService],
  exports: [TeamMembersService],
})
export class TeamMembersModule {}
