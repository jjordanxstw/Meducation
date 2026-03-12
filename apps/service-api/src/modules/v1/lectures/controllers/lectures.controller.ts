/**
 * Lectures Controller
 * Handles lecture endpoints
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
import { LecturesService } from '../services/lectures.service';
import { GoogleAuthGuard, AdminGuard } from '../../auth/guards';
import { Admin } from '../../../../common';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'lectures', version: '1' })
export class LecturesController {
  constructor(private readonly lecturesService: LecturesService) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('section_id') sectionId?: string,
    @Query('is_active') isActive?: string,
  ) {
    const data = await this.lecturesService.findAll(
      sectionId,
      isActive === 'false' ? false : true,
    );
    return { success: true, data };
  }

  @Get(':id')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.lecturesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.lecturesService.create(createDto);
    return { success: true, data };
  }

  @Put(':id')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.lecturesService.update(id, updateDto);
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.lecturesService.delete(id);
    return { success: true, message: 'Lecture deleted successfully' };
  }

  @Patch('reorder')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async reorder(@Body() body: { items: Array<{ id: string; order_index: number }> }) {
    const result = await this.lecturesService.reorder(body.items);
    return { success: true, ...result };
  }
}
