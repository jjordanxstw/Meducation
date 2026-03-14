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
  Request,
  HttpCode,
  HttpStatus,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { WatermarkService } from '../services/watermark.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { VerifyTokenDto } from '../dto';
import { GoogleAuthGuard } from '../guards';
import { CurrentUser } from '../../../../common';
import { SkipEnvelope } from '../../../../common';
import type { UserWithoutPassword } from '../entities/profile.entity';

/**
 * Student Auth Request Interface
 */
interface StudentRequest extends Request {
  user?: UserWithoutPassword;
  cookies?: {
    student_refresh_token?: string;
  };
}

/**
 * Extract IP and User Agent from request
 */
function extractRequestInfo(req: Request) {
  const headers = req.headers as unknown as Record<string, string | string[] | undefined>;
  const forwardedFor = headers['x-forwarded-for'];
  const realIp = headers['x-real-ip'];
  const userAgent = headers['user-agent'];
  const platform = headers['sec-ch-ua-platform'];
  const ua = headers['sec-ch-ua'];

  // Extract IP address - return undefined if not available (INET type doesn't accept 'unknown')
  let ipAddress: string | undefined = undefined;
  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    ipAddress = forwardedFor[0].split(',')[0].trim();
  } else if (typeof forwardedFor === 'string') {
    ipAddress = forwardedFor.split(',')[0].trim();
  } else if (typeof realIp === 'string') {
    ipAddress = realIp;
  }

  return {
    ipAddress, // Will be undefined if no valid IP found
    userAgent: typeof userAgent === 'string' ? userAgent : 'unknown',
    deviceInfo: {
      device: typeof platform === 'string' ? platform : 'unknown',
      browser: typeof ua === 'string' ? ua : 'unknown',
    },
  };
}

type CookieSameSite = 'strict' | 'lax' | 'none';

function resolveCookieSameSite(configService: ConfigService, isDevelopment: boolean): CookieSameSite {
  const rawValue = configService.get<string>('STUDENT_COOKIE_SAMESITE')?.toLowerCase();

  if (rawValue === 'strict' || rawValue === 'lax' || rawValue === 'none') {
    return rawValue;
  }

  return isDevelopment ? 'lax' : 'strict';
}

function resolveCookieSecure(configService: ConfigService, isDevelopment: boolean): boolean {
  const rawValue = configService.get<string>('STUDENT_COOKIE_SECURE')?.toLowerCase();

  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  return !isDevelopment;
}

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly watermarkService: WatermarkService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
  ) {}

  private getBaseCookieOptions(expiresAt?: Date) {
    const isDevelopment = this.configService.get<string>('NODE_ENV') !== 'production';
    const sameSite = resolveCookieSameSite(this.configService, isDevelopment);
    const secure = resolveCookieSecure(this.configService, isDevelopment) || sameSite === 'none';
    const domain = this.configService.get<string>('STUDENT_COOKIE_DOMAIN')?.trim();

    return {
      httpOnly: true,
      secure,
      sameSite,
      ...(expiresAt ? { maxAge: expiresAt.getTime() - Date.now() } : {}),
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }

  /**
   * POST /api/v1/auth/verify
   * Verify Google token and return user session with refresh token
   */
  @Post('verify')
  @SkipEnvelope()
  async verifyToken(
    @Body(ValidationPipe) verifyTokenDto: VerifyTokenDto,
    @Request() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    success: true;
    data: {
      user: UserWithoutPassword;
      accessToken: string;
      expiresIn: number;
      refreshToken: string;
      refreshTokenExpiresAt: string;
    };
  }> {
    const { user } = await this.authService.verifyCredential(verifyTokenDto.idToken);
    const requestInfo = extractRequestInfo(req);

    // Generate refresh token
    const refreshTokenResult = await this.refreshTokenService.generateRefreshToken({
      userId: user.id,
      userType: 'student',
      ...requestInfo,
    });

    // Issue access token
    const tokenResult = await this.authService.issueToken(user);

    // Set httpOnly cookies
    const cookieOptions = this.getBaseCookieOptions(refreshTokenResult.expiresAt);

    // Set access token cookie (short-lived, 15min)
    res.cookie('student_access_token', tokenResult.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    // Set refresh token cookie (long-lived, 7 days)
    res.cookie('student_refresh_token', refreshTokenResult.token, cookieOptions);

    return {
      success: true,
      data: {
        user,
        accessToken: tokenResult.accessToken,
        expiresIn: tokenResult.expiresIn,
        refreshToken: refreshTokenResult.token,
        refreshTokenExpiresAt: refreshTokenResult.expiresAt.toISOString(),
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
    @Request() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { token?: string },
  ): Promise<{
    success: true;
    data: { message: string };
  }> {
    const studentReq = req as StudentRequest;

    // Revoke refresh token from database if present
    const refreshToken = studentReq.cookies?.student_refresh_token;
    if (refreshToken) {
      const tokenInfo = await this.refreshTokenService.verifyRefreshToken(refreshToken);
      if (tokenInfo) {
        await this.refreshTokenService.revokeRefreshToken(tokenInfo.tokenId);
      }
    }

    // Optionally revoke Google token if provided
    const providedToken = body?.token;
    if (providedToken) {
      try {
        await this.authService.revokeGoogleToken(providedToken);
      } catch (e) {
        console.warn('revocation failed', e);
      }
    }

    // Clear cookies
    const cookieOptions = this.getBaseCookieOptions();

    res.clearCookie('student_access_token', cookieOptions);
    res.clearCookie('student_refresh_token', cookieOptions);

    // Also clear old session cookie for backwards compatibility
    const sessionCookieName = this.configService.get<string>('SESSION_COOKIE_NAME', 'session');
    res.clearCookie(sessionCookieName, cookieOptions);

    return {
      success: true,
      data: { message: 'Logged out' },
    };
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  async refreshToken(
    @Request() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    success: true;
    data: {
      accessToken: string;
      expiresIn: number;
      refreshToken: string;
      refreshTokenExpiresAt: string;
    };
  }> {
    // Get refresh token from cookie
    const studentReq = req as StudentRequest;
    const refreshToken = studentReq.cookies?.student_refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const requestInfo = extractRequestInfo(req);

    // Rotate refresh token (revoke old, create new)
    const rotationResult = await this.refreshTokenService.rotateRefreshToken(
      refreshToken,
      requestInfo
    );

    // Get user info to sign new access token
    const tokenInfo = await this.refreshTokenService.verifyRefreshToken(rotationResult.token);
    if (!tokenInfo) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user info from session
    const sessionPayload = await this.authService.verifySessionToken(refreshToken);
    if (!sessionPayload || !sessionPayload.sub) {
      throw new UnauthorizedException('Invalid session');
    }

    // Re-verify Google token to get latest user info
    const user = await this.authService.getSessionFromCookie(refreshToken);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new access token
    const tokenResult = await this.authService.issueToken(user);

    // Set new cookies
    const cookieOptions = this.getBaseCookieOptions(rotationResult.expiresAt);

    res.cookie('student_access_token', tokenResult.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('student_refresh_token', rotationResult.token, cookieOptions);

    return {
      success: true,
      data: {
        accessToken: tokenResult.accessToken,
        expiresIn: tokenResult.expiresIn,
        refreshToken: rotationResult.token,
        refreshTokenExpiresAt: rotationResult.expiresAt.toISOString(),
      },
    };
  }

  /**
   * GET /api/v1/auth/sessions
   * List all active sessions for the current user
   */
  @Get('sessions')
  @UseGuards(GoogleAuthGuard)
  @SkipEnvelope()
  async getSessions(@CurrentUser() user: UserWithoutPassword): Promise<{
    success: true;
    data: {
      sessions: Array<{
        id: string;
        created: string;
        expires: string;
        ipAddress: string | null;
        device: string;
        browser: string;
      }>;
    };
  }> {
    const sessions = await this.refreshTokenService.getActiveSessions(user.id);

    return {
      success: true,
      data: {
        sessions: sessions.map(s => ({
          id: s.id,
          created: s.created_at,
          expires: s.expires_at,
          ipAddress: s.ip_address,
          device: s.device_info?.device || 'unknown',
          browser: s.device_info?.browser || 'unknown',
        })),
      },
    };
  }

  /**
   * POST /api/v1/auth/sessions/:tokenId/revoke
   * Revoke a specific session
   */
  @Post('sessions/:tokenId/revoke')
  @UseGuards(GoogleAuthGuard)
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  async revokeSession(
    @Param('tokenId') tokenId: string,
  ): Promise<{
    success: true;
    data: { message: string };
  }> {
    const success = await this.refreshTokenService.revokeRefreshToken(tokenId);
    if (!success) {
      throw new UnauthorizedException('Session not found or already revoked');
    }

    return {
      success: true,
      data: { message: 'Session revoked successfully' },
    };
  }

  /**
   * POST /api/v1/auth/sessions/revoke-others
   * Revoke all sessions except the current one
   */
  @Post('sessions/revoke-others')
  @UseGuards(GoogleAuthGuard)
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  async revokeOtherSessions(
    @Request() req: Request,
    @CurrentUser() user: UserWithoutPassword,
  ): Promise<{
    success: true;
    data: { message: string };
  }> {
    const studentReq = req as StudentRequest;
    const currentRefreshToken = studentReq.cookies?.student_refresh_token;
    if (!currentRefreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    const tokenInfo = await this.refreshTokenService.verifyRefreshToken(currentRefreshToken);
    if (!tokenInfo) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const count = await this.refreshTokenService.revokeOtherSessions(user.id, tokenInfo.tokenId);

    return {
      success: true,
      data: { message: `Revoked ${count} other session(s) successfully` },
    };
  }

  /**
   * POST /api/v1/auth/sessions/revoke-all
   * Revoke all sessions including the current one
   */
  @Post('sessions/revoke-all')
  @UseGuards(GoogleAuthGuard)
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  async revokeAllSessions(@CurrentUser() user: UserWithoutPassword): Promise<{
    success: true;
    data: { message: string };
  }> {
    const count = await this.refreshTokenService.revokeAllUserTokens(user.id);

    return {
      success: true,
      data: { message: `Revoked all ${count} session(s) successfully` },
    };
  }
}
