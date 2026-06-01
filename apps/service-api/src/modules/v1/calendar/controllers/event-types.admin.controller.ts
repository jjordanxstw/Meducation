/**
 * Event Types Admin Controller
 * Admin CRUD for calendar event types (name + color).
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EventTypesService } from '../services/event-types.service';
import { AuditService } from '../../audit/services/audit.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope, ResponseCacheService, IdempotencyInterceptor } from '../../../../common';

// Renaming/recoloring a type changes how events render, so flush calendar caches.
const INVALIDATE_EVENT_TYPE_PREFIXES = ['v1:calendar:', 'v1:admin:statistics:'];

@Controller({ path: 'admin/event-types', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class EventTypesAdminController {
  constructor(
    private readonly eventTypesService: EventTypesService,
    private readonly responseCache: ResponseCacheService,
    private readonly audit: AuditService,
  ) {}

  private invalidateCaches(): void {
    this.responseCache.deleteByPrefixes(INVALIDATE_EVENT_TYPE_PREFIXES);
  }

  @Get()
  @SkipEnvelope()
  async findAll() {
    const data = await this.eventTypesService.findAll();
    return {
      success: true,
      data,
      pagination: { page: 1, pageSize: data.length, total: data.length, totalPages: data.length > 0 ? 1 : 0 },
    };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.eventTypesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.eventTypesService.create(createDto);
    this.invalidateCaches();
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.eventTypesService.update(id, updateDto);
    this.invalidateCaches();
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string, @Req() req: any) {
    const { oldData } = await this.eventTypesService.delete(id);
    await this.audit.logAdminDelete('event_types', id, oldData, req.admin, req);
    this.invalidateCaches();
    return { success: true, message: 'Event type deleted successfully' };
  }
}
