/**
 * Lectures Module
 * Handles lecture management
 */

import { Module } from '@nestjs/common';
import { LecturesController } from './controllers/lectures.controller';
import { LecturesService } from './services/lectures.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [LecturesController],
  providers: [LecturesService],
  exports: [LecturesService],
})
export class LecturesModule {}
