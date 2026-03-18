/**
 * Subjects Admin Controller
 * Admin management endpoints for subjects
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
import { SubjectsService } from '../services/subjects.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'admin/subjects', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class SubjectsAdminController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @SkipEnvelope()
  async findAll(
    @Query('year_level') yearLevel?: string,
    @Query('is_active') isActive?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.subjectsService.findAll(
      yearLevel ? parseInt(yearLevel, 10) : undefined,
      isActive === 'false' ? false : true,
      search,
    );

    return { success: true, data };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.subjectsService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.subjectsService.create(createDto);
    return { success: true, data };
  }

  @Put(':id')
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.subjectsService.update(id, updateDto);
    return { success: true, data: data.newData };
  }

  @Delete(':id')
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.subjectsService.delete(id);
    return { success: true, message: 'Subject deleted successfully' };
  }

  @Patch('reorder')
  @SkipEnvelope()
  async reorder(@Body() body: { items: Array<{ id: string; order_index: number }> }) {
    const result = await this.subjectsService.reorder(body.items);
    return { success: true, ...result };
  }
}
