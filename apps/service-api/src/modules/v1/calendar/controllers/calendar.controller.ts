/**
 * Calendar Controller
 * Handles calendar event endpoints
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CalendarService } from '../services/calendar.service';
import { AnyAuthGuard } from '../../../../common';
import { AdminGuard } from '../../auth/guards';
import { Admin } from '../../../../common';
import { CurrentUser } from '../../../../common';
import { SkipEnvelope } from '../../../../common';
import type { UserWithoutPassword } from '../../auth/entities/profile.entity';

@Controller({ path: 'calendar', version: '1' })
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @UseGuards(AnyAuthGuard)
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
  @UseGuards(AnyAuthGuard)
  @SkipEnvelope()
  async getByMonth(@Param('year') year: string, @Param('month') month: string) {
    const data = await this.calendarService.getByMonth(parseInt(year, 10), parseInt(month, 10));
    return { success: true, data };
  }

  @Get('upcoming')
  @UseGuards(AnyAuthGuard)
  @SkipEnvelope()
  async getUpcoming(@Query('limit') limit?: string) {
    const data = await this.calendarService.getUpcoming(limit ? parseInt(limit, 10) : 10);
    return { success: true, data };
  }

  @Get(':id')
  @UseGuards(AnyAuthGuard)
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.calendarService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(AnyAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async create(@Body() createDto: any, @CurrentUser() user: UserWithoutPassword) {
    const data = await this.calendarService.create(createDto, user.id);
    return { success: true, data };
  }

  @Put(':id')
  @UseGuards(AnyAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.calendarService.update(id, updateDto);
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @UseGuards(AnyAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.calendarService.delete(id);
    return { success: true, message: 'Calendar event deleted successfully' };
  }
}
