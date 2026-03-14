/**
 * Resources Module
 * Handles resource management
 */

import { Module } from '@nestjs/common';
import { ResourcesPublicController } from './controllers/resources.controller';
import { ResourcesAdminController } from './controllers/resources.admin.controller';
import { ResourcesService } from './services/resources.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [ResourcesPublicController, ResourcesAdminController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
