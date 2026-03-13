/**
 * Calendar Module
 * Handles calendar event management
 */

import { Module } from '@nestjs/common';
import { CalendarController } from './controllers/calendar.controller';
import { CalendarService } from './services/calendar.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AnyAuthGuard } from '../../../common';

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [CalendarController],
  providers: [CalendarService, AnyAuthGuard],
  exports: [CalendarService],
})
export class CalendarModule {}
