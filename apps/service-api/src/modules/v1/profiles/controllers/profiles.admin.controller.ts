/**
 * Profiles Admin Controller
 * Admin management endpoints for profiles
 */

import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from '../services/profiles.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards';
import { SkipEnvelope } from '../../../../common';

@Controller({ path: 'admin/profiles', version: '1' })
@UseGuards(AdminJwtAuthGuard)
export class ProfilesAdminController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  @SkipEnvelope()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('role') role?: string,
    @Query('year_level') yearLevel?: string,
  ) {
    const result = await this.profilesService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      role,
      yearLevel ? parseInt(yearLevel, 10) : undefined,
    );
    return { success: true, ...result };
  }

  @Get(':id')
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.profilesService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  @SkipEnvelope()
  async update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Req() req: any,
  ) {
    const data = await this.profilesService.update(
      id,
      updateDto,
      req.admin?.id,
      'admin',
    );
    return { success: true, data: data.newData };
  }
}
