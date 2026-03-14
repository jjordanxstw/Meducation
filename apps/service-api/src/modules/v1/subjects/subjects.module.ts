/**
 * Subjects Module
 * Handles subject management
 */

import { Module } from '@nestjs/common';
import { SubjectsPublicController } from './controllers/subjects.controller';
import { SubjectsAdminController } from './controllers/subjects.admin.controller';
import { SubjectsService } from './services/subjects.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [SubjectsPublicController, SubjectsAdminController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
