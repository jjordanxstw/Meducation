/**
 * Calendar Controller
 * Handles calendar event endpoints
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CalendarService } from '../services/calendar.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'calendar', version: '1' })
export class CalendarPublicController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('type') type?: string,
    @Query('subject_id') subjectId?: string,
  ) {
    const data = await this.calendarService.findAll(startDate, endDate, type, subjectId);
    return { success: true, data };
  }

  @Get('month/:year/:month')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async getByMonth(@Param('year') year: string, @Param('month') month: string) {
    const data = await this.calendarService.getByMonth(parseInt(year, 10), parseInt(month, 10));
    return { success: true, data };
  }

  @Get('upcoming')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async getUpcoming(@Query('limit') limit?: string) {
    const data = await this.calendarService.getUpcoming(limit ? parseInt(limit, 10) : 10);
    return { success: true, data };
  }

  @Get(':id')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.calendarService.findOne(id);
    return { success: true, data };
  }
}
