/**
 * Subjects Module
 * Handles subject management
 */

import { Module } from '@nestjs/common';
import { SubjectsController } from './controllers/subjects.controller';
import { SubjectsService } from './services/subjects.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
