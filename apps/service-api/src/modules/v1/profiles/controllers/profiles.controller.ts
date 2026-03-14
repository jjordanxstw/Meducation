/**
 * Profiles Controller
 * Handles profile endpoints
 */

import {
  ForbiddenException,
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from '../services/profiles.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../../../common';
import { SkipEnvelope } from '../../../../common';
import type { UserWithoutPassword } from '../../auth/entities/profile.entity';

@Controller({ path: 'profiles', version: '1' })
export class ProfilesPublicController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':id')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findOne(@Param('id') id: string, @CurrentUser() user: UserWithoutPassword) {
    if (user.id !== id) {
      throw new ForbiddenException('You can only access your own profile');
    }

    const data = await this.profilesService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(GoogleAuthGuard)
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
