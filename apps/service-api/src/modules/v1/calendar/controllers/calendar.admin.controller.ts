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
import { SkipEnvelope, ResponseCacheService } from '../../../../common';

const INVALIDATE_CALENDAR_PREFIXES = ['v1:calendar:', 'v1:admin:statistics:'];

@Controller({ path: 'admin/calendar', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class CalendarAdminController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly responseCache: ResponseCacheService,
  ) {}

  private invalidateCalendarCache(): void {
    this.responseCache.deleteByPrefixes(INVALIDATE_CALENDAR_PREFIXES);
  }

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
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.calendarService.findAll(
      startDate,
      endDate,
      type,
      subjectId,
      search,
      sortBy,
      sortOrder,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 15,
    );

    const data = Array.isArray(result) ? result : result.data;
    const pagination = Array.isArray(result)
      ? {
          page: 1,
          pageSize: data.length,
          total: data.length,
          totalPages: data.length > 0 ? 1 : 0,
        }
      : result.pagination;

    return { success: true, data, pagination };
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
    this.invalidateCalendarCache();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.calendarService.update(id, updateDto);
    this.invalidateCalendarCache();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.calendarService.delete(id);
    this.invalidateCalendarCache();
    return { success: true, message: 'Calendar event deleted successfully' };
  }
}
