/**
 * Resources Controller
 * Handles resource endpoints
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ResourcesService } from '../services/resources.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'resources', version: '1' })
export class ResourcesPublicController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findAll(
    @Query('subject_id') subjectId?: string,
    @Query('section_id') sectionId?: string,
    @Query('lecture_id') lectureId?: string,
    @Query('type') type?: string,
    @Query('is_active') isActive?: string,
  ) {
    const data = await this.resourcesService.findAll(
      subjectId,
      sectionId,
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
}
