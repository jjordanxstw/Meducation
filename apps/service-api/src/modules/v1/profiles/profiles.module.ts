/**
 * Profiles Module
 * Handles user profile management
 */

import { Module } from '@nestjs/common';
import { ProfilesController } from './controllers/profiles.controller';
import { ProfilesService } from './services/profiles.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AnyAuthGuard } from '../../../common';

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, AnyAuthGuard],
  exports: [ProfilesService],
})
export class ProfilesModule {}
