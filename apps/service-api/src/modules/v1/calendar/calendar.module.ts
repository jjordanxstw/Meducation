/**
 * Calendar Module
 * Handles calendar event management
 */

import { Module } from '@nestjs/common';
import { CalendarPublicController } from './controllers/calendar.controller';
import { CalendarAdminController } from './controllers/calendar.admin.controller';
import { CalendarService } from './services/calendar.service';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [CalendarPublicController, CalendarAdminController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
