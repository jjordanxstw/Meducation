/**
 * Lectures Admin Controller
 * Admin management endpoints for lectures
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
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'admin/lectures', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class LecturesAdminController {
  constructor(private readonly lecturesService: LecturesService) {}

  @Get()
  @SkipEnvelope()
  async findAll(
    @Query('subject_id') subjectId?: string,
    @Query('section_id') sectionId?: string,
    @Query('is_active') isActive?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.lecturesService.findAll(
      subjectId,
      sectionId,
      isActive === 'false' ? false : true,
      search,
    );
    return { success: true, data };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.lecturesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.lecturesService.create(createDto);
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.lecturesService.update(id, updateDto);
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.lecturesService.delete(id);
    return { success: true, message: 'Lecture deleted successfully' };
  }

  @Patch('reorder')
  @SkipEnvelope()
  async reorder(@Body() body: { items: Array<{ id: string; order_index: number }> }) {
    const result = await this.lecturesService.reorder(body.items);
    return { success: true, ...result };
  }
}
