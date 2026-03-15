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
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from '../services/profiles.service';
import { GoogleAuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../../../common';
import { SkipEnvelope } from '../../../../common';
import type { UserWithoutPassword } from '../../auth/entities/profile.entity';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

@Controller({ path: 'profiles', version: '1' })
export class ProfilesPublicController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':id')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async findOne(@Param('id') id: string, @CurrentUser() user: UserWithoutPassword) {
    if (user.id !== id) {
      throw new AppException(ErrorCode.AUTHZ_FORBIDDEN, { resource: 'profile', targetId: id });
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
