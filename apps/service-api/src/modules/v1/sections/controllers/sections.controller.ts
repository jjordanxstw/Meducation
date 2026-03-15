/**
 * Sections Controller
 * Handles section endpoints
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SectionsService } from '../services/sections.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'sections', version: '1' })
export class SectionsPublicController {
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
}
