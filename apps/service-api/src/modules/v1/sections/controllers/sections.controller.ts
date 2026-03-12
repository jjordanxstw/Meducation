/**
 * Sections Controller
 * Handles section endpoints
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
import { SectionsService } from '../services/sections.service';
import { GoogleAuthGuard, AdminGuard } from '../../auth/guards';
import { Admin } from '../../../../common';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'sections', version: '1' })
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('subject_id') subjectId?: string,
    @Query('is_active') isActive?: string,
  ) {
    const data = await this.sectionsService.findAll(
      subjectId,
      isActive === 'false' ? false : true,
    );
    return { success: true, data };
  }

  @Get(':id')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.sectionsService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.sectionsService.create(createDto);
    return { success: true, data };
  }

  @Put(':id')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.sectionsService.update(id, updateDto);
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.sectionsService.delete(id);
    return { success: true, message: 'Section deleted successfully' };
  }

  @Patch('reorder')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async reorder(@Body() body: { items: Array<{ id: string; order_index: number }> }) {
    const result = await this.sectionsService.reorder(body.items);
    return { success: true, ...result };
  }
}
