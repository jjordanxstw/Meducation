/**
 * Subjects Controller
 * Handles subject endpoints
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubjectsService } from '../services/subjects.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'subjects', version: '1' })
export class SubjectsPublicController {
  constructor(private readonly subjectsService: SubjectsService) {}

  /**
   * GET /api/v1/subjects
    * Public read endpoint for subjects
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
    * Public read endpoint for subject detail and hierarchy
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
}
