/**
 * Profiles Module
 * Handles user profile management
 */

import { Module } from '@nestjs/common';
import { ProfilesController } from './controllers/profiles.controller';
import { ProfilesService } from './services/profiles.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
