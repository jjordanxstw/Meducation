/**
 * Sections Module
 * Handles section management
 */

import { Module } from '@nestjs/common';
import { SectionsController } from './controllers/sections.controller';
import { SectionsService } from './services/sections.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SectionsController],
  providers: [SectionsService],
  exports: [SectionsService],
})
export class SectionsModule {}
