/**
 * Lectures Controller
 * Handles lecture endpoints
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LecturesService } from '../services/lectures.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'lectures', version: '1' })
export class LecturesPublicController {
  constructor(private readonly lecturesService: LecturesService) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('subject_id') subjectId?: string,
    @Query('section_id') sectionId?: string,
    @Query('is_active') isActive?: string,
  ) {
    const data = await this.lecturesService.findAll(
      subjectId,
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
}
