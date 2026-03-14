/**
 * Audit Module
 * Handles audit logs
 */

import { Module } from '@nestjs/common';
import { AuditController } from './controllers/audit.controller';
import { AuditAdminController } from './controllers/audit.admin.controller';
import { AuditService } from './services/audit.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AnyAuthGuard } from '../../../common';

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [AuditController, AuditAdminController],
  providers: [AuditService, AnyAuthGuard],
  exports: [AuditService],
})
export class AuditModule {}
