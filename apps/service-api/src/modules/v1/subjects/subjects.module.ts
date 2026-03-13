/**
 * Subjects Module
 * Handles subject management
 */

import { Module } from '@nestjs/common';
import { SubjectsController } from './controllers/subjects.controller';
import { SubjectsService } from './services/subjects.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AnyAuthGuard } from '../../../common';

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [SubjectsController],
  providers: [SubjectsService, AnyAuthGuard],
  exports: [SubjectsService],
})
export class SubjectsModule {}
