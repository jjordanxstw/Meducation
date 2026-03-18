/**
 * Calendar Admin Controller
 * Admin management endpoints for calendar events
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
  Req,
  UseGuards,
} from '@nestjs/common';
import { CalendarService } from '../services/calendar.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'admin/calendar', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class CalendarAdminController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @SkipEnvelope()
  async findAll(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('type') type?: string,
    @Query('subject_id') subjectId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const data = await this.calendarService.findAll(startDate, endDate, type, subjectId, search, sortBy, sortOrder);
    return { success: true, data };
  }

  @Get('month/:year/:month')
  @SkipEnvelope()
  async getByMonth(@Param('year') year: string, @Param('month') month: string) {
    const data = await this.calendarService.getByMonth(parseInt(year, 10), parseInt(month, 10));
    return { success: true, data };
  }

  @Get('upcoming')
  @SkipEnvelope()
  async getUpcoming(@Query('limit') limit?: string) {
    const data = await this.calendarService.getUpcoming(limit ? parseInt(limit, 10) : 10);
    return { success: true, data };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.calendarService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @SkipEnvelope()
  async create(@Body() createDto: any, @Req() req: any) {
    const data = await this.calendarService.create(createDto, req.admin?.id);
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.calendarService.update(id, updateDto);
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.calendarService.delete(id);
    return { success: true, message: 'Calendar event deleted successfully' };
  }
}
