/**
 * Resources Admin Controller
 * Admin management endpoints for resources
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ResourcesService } from '../services/resources.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'admin/resources', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class ResourcesAdminController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @SkipEnvelope()
  async findAll(
    @Query('lecture_id') lectureId?: string,
    @Query('type') type?: string,
    @Query('is_active') isActive?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.resourcesService.findAll(
      lectureId,
      type,
      isActive === 'false' ? false : true,
      search,
    );
    return { success: true, data };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.resourcesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.resourcesService.create(createDto);
    return { success: true, data };
  }

  @Post('bulk')
  @SkipEnvelope()
  async bulkCreate(@Body() body: { resources: any[] }) {
    const data = await this.resourcesService.bulkCreate(body.resources);
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.resourcesService.update(id, updateDto);
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.resourcesService.delete(id);
    return { success: true, message: 'Resource deleted successfully' };
  }

  @Patch('reorder')
  @SkipEnvelope()
  async reorder(@Body() body: { items: Array<{ id: string; order_index: number }> }) {
    const result = await this.resourcesService.reorder(body.items);
    return { success: true, ...result };
  }
}
