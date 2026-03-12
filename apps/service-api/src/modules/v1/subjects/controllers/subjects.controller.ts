/**
 * Subjects Controller
 * Handles subject endpoints
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
import { GoogleAuthGuard, AdminGuard } from '../../auth/guards';
import { Admin } from '../../../../common';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'subjects', version: '1' })
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  /**
   * GET /api/v1/subjects
   * Get all subjects with optional filtering
   */
  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('year_level') yearLevel?: string,
    @Query('is_active') isActive?: string,
  ) {
    const data = await this.subjectsService.findAll(
      yearLevel ? parseInt(yearLevel, 10) : undefined,
      isActive === 'false' ? false : true,
    );

    return {
      success: true,
      data,
    };
  }

  /**
   * GET /api/v1/subjects/:id
   * Get subject with full hierarchy (sections, lectures, resources)
   */
  @Get(':id')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.subjectsService.findOne(id);

    return {
      success: true,
      data,
    };
  }

  /**
   * POST /api/v1/subjects
   * Create new subject (admin only)
   */
  @Post()
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async create(@Body() createDto: any) {
    const data = await this.subjectsService.create(createDto);

    return {
      success: true,
      data,
    };
  }

  /**
   * PUT /api/v1/subjects/:id
   * Update subject (admin only)
   */
  @Put(':id')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const data = await this.subjectsService.update(id, updateDto);

    return {
      success: true,
      data: data.newData,
    };
  }

  /**
   * DELETE /api/v1/subjects/:id
   * Delete subject (admin only)
   */
  @Delete(':id')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async delete(@Param('id') id: string) {
    await this.subjectsService.delete(id);

    return {
      success: true,
      message: 'Subject deleted successfully',
    };
  }

  /**
   * PATCH /api/v1/subjects/reorder
   * Reorder subjects (admin only)
   */
  @Patch('reorder')
  @UseGuards(GoogleAuthGuard, AdminGuard)
  @Admin()
  @SkipEnvelope()
  async reorder(@Body() body: { items: Array<{ id: string; order_index: number }> }) {
    const result = await this.subjectsService.reorder(body.items);

    return {
      success: true,
      ...result,
    };
  }
}
