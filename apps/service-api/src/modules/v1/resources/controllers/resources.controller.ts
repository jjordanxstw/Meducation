/**
 * Resources Controller
 * Handles resource endpoints
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
import { GoogleAuthGuard, AdminGuard } from '../../auth/guards';
import { Admin } from '../../../../common';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'resources', version: '1' })
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('lecture_id') lectureId?: string,
    @Query('type') type?: string,
    @Query('is_active') isActive?: string,
  ) {
    const data = await this.resourcesService.findAll(
      lectureId,
      type,
      isActive === 'false' ? false : true,
    );
    return { success: true, data };
  }

  @Get(':id')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.resourcesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.resourcesService.create(createDto);
    return { success: true, data };
  }

  @Post('bulk')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async bulkCreate(@Body() body: { resources: any[] }) {
    const data = await this.resourcesService.bulkCreate(body.resources);
    return { success: true, data };
  }

  @Put(':id')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.resourcesService.update(id, updateDto);
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.resourcesService.delete(id);
    return { success: true, message: 'Resource deleted successfully' };
  }

  @Patch('reorder')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async reorder(@Body() body: { items: Array<{ id: string; order_index: number }> }) {
    const result = await this.resourcesService.reorder(body.items);
    return { success: true, ...result };
  }
}
