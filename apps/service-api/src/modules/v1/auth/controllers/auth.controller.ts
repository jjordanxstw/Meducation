/**
 * Auth Controller
 * Handles authentication endpoints
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Res,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { WatermarkService } from '../services/watermark.service';
import { VerifyTokenDto } from '../dto';
import { GoogleAuthGuard } from '../guards';
import { CurrentUser } from '../../../../common';
import { SkipEnvelope } from '../../../../common';
import type { UserWithoutPassword } from '../entities/profile.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly watermarkService: WatermarkService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /api/v1/auth/verify
   * Verify Google token and return user session
   */
  @Post('verify')
  @SkipEnvelope()
  async verifyToken(
    @Body(ValidationPipe) verifyTokenDto: VerifyTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    success: true;
    data: {
      user: UserWithoutPassword;
    };
  }> {
    const { user, sessionToken } = await this.authService.verifyCredential(verifyTokenDto.idToken);

    // Set httpOnly secure cookie
    const sessionCookieName = this.configService.get<string>('SESSION_COOKIE_NAME', 'session');
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    const maxAge = this.configService.get<number>('SESSION_COOKIE_MAX_AGE_MS', 60 * 60 * 1000);

    res.cookie(sessionCookieName, sessionToken, {
      httpOnly: true,
      secure: !isDev,
      sameSite: 'lax',
      maxAge,
    });

    return {
      success: true,
      data: {
        user,
      },
    };
  }

  /**
   * GET /api/v1/auth/me
   * Get current user info
   */
  @Get('me')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async getMe(@CurrentUser() user: UserWithoutPassword): Promise<{
    success: true;
    data: {
      user: UserWithoutPassword;
    };
  }> {
    return {
      success: true,
      data: {
        user,
      },
    };
  }

  /**
   * GET /api/v1/auth/watermark
   * Get watermark configuration for current user
   */
  @Get('watermark')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async getWatermark(@CurrentUser() user: UserWithoutPassword): Promise<{
    success: true;
    data: ReturnType<WatermarkService['generatePayload']>;
  }> {
    if (!user.profile) {
      throw new BadRequestException('User profile not found');
    }

    const watermarkPayload = this.watermarkService.generatePayload({
      id: user.id,
      email: user.email,
      fullName: user.profile.full_name,
      studentId: (user.profile as any).student_id || undefined,
    });

    return {
      success: true,
      data: watermarkPayload,
    };
  }

  /**
   * POST /api/v1/auth/logout
   * Revoke token and clear session
   */
  @Post('logout')
  @SkipEnvelope()
  async logout(
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { token?: string },
  ): Promise<{
    success: true;
    data: { message: string };
  }> {
    // Optionally revoke Google token if provided
    const providedToken = body?.token;
    if (providedToken) {
      try {
        await this.authService.revokeGoogleToken(providedToken);
      } catch (e) {
        console.warn('revocation failed', e);
      }
    }

    // Clear server session cookie
    const sessionCookieName = this.configService.get<string>('SESSION_COOKIE_NAME', 'session');
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';

    res.clearCookie(sessionCookieName, {
      httpOnly: true,
      secure: !isDev,
      sameSite: 'lax',
    });

    return {
      success: true,
      data: { message: 'Logged out' },
    };
  }
}
