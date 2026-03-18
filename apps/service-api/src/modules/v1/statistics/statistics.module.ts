/**
 * Statistics Module
 * Aggregated metrics for admin dashboard
 */

import { Module } from '@nestjs/common';
import { StatisticsAdminController } from './controllers/statistics.admin.controller';
import { StatisticsService } from './services/statistics.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [StatisticsAdminController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
