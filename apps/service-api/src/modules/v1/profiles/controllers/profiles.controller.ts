/**
 * Profiles Controller
 * Handles profile endpoints
 */

import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from '../services/profiles.service';
import { AnyAuthGuard } from '../../../../common';
import { AdminGuard } from '../../auth/guards';
import { Admin } from '../../../../common';
import { CurrentUser } from '../../../../common';
import { SkipEnvelope } from '../../../../common';
import type { UserWithoutPassword } from '../../auth/entities/profile.entity';

@Controller({ path: 'profiles', version: '1' })
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  @UseGuards(AnyAuthGuard, AdminGuard)
  @Admin()
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
  @UseGuards(AnyAuthGuard)
  @SkipEnvelope()
  async findOne(@Param('id') id: string) {
    const data = await this.profilesService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(AnyAuthGuard)
  @SkipEnvelope()
  async update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentUser() user: UserWithoutPassword,
  ) {
    const data = await this.profilesService.update(
      id,
      updateDto,
      user.id,
      user.profile?.role,
    );
    return { success: true, data: data.newData };
  }
}
