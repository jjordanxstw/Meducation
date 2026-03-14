/**
 * Admin Auth Controller
 * Handles admin authentication endpoints
 * Separate from student OAuth endpoints
 */

import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminRefreshTokenService } from '../services/admin-refresh-token.service';
import { AdminLoginDto, ChangePasswordDto } from '../dto';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { SkipEnvelope } from '../../../../common';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

/**
 * Current Admin Request Interface
 */
interface AdminRequest extends Request {
  admin?: {
    id: string;
    username: string;
    full_name: string;
    email?: string;
    is_active: boolean;
    is_super_admin: boolean;
  };
  cookies?: {
    admin_access_token?: string;
    admin_refresh_token?: string;
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

function resolveCookieSameSite(configService: ConfigService, isProduction: boolean): CookieSameSite {
  const rawValue = configService.get<string>('ADMIN_COOKIE_SAMESITE')?.toLowerCase();

  if (rawValue === 'strict' || rawValue === 'lax' || rawValue === 'none') {
    return rawValue;
  }

  return isProduction ? 'strict' : 'lax';
}

function resolveCookieSecure(configService: ConfigService, isProduction: boolean): boolean {
  const rawValue = configService.get<string>('ADMIN_COOKIE_SECURE')?.toLowerCase();

  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  return isProduction;
}

@ApiTags('Admin Authentication')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly refreshTokenService: AdminRefreshTokenService,
    private readonly configService: ConfigService,
  ) {}

  private getBaseCookieOptions(expiresAt?: Date) {
    const isProduction = process.env.NODE_ENV === 'production';
    const sameSite = resolveCookieSameSite(this.configService, isProduction);
    const secure = resolveCookieSecure(this.configService, isProduction) || sameSite === 'none';
    const domain = this.configService.get<string>('ADMIN_COOKIE_DOMAIN')?.trim();

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
   * Admin Login
   * Authenticate with username and password, returns access and refresh tokens
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  @ApiOperation({
    summary: 'Admin login',
    description: 'Authenticate admin user with username and password. Returns JWT access token and refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token (15min expiry)' },
        expiresIn: { type: 'number', description: 'Access token expiration in seconds' },
        refreshToken: { type: 'string', description: 'Refresh token (7 day expiry)' },
        refreshTokenExpiresAt: { type: 'string', description: 'Refresh token expiration ISO date' },
        admin: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            full_name: { type: 'string' },
            email: { type: 'string' },
            is_active: { type: 'boolean' },
            is_super_admin: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account inactive' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async login(
    @Body() loginDto: AdminLoginDto,
    @Request() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.adminAuthService.login(
      loginDto.username,
      loginDto.password,
    );

    // Generate refresh token
    const requestInfo = extractRequestInfo(req);
    const refreshTokenResult = await this.refreshTokenService.generateRefreshToken({
      userId: result.admin.id,
      userType: 'admin',
      ...requestInfo,
    });

    // Set httpOnly cookies for security
    const cookieOptions = this.getBaseCookieOptions(refreshTokenResult.expiresAt);

    // Set access token cookie (short-lived, 15min)
    response.cookie('admin_access_token', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Set refresh token cookie (long-lived, 7 days)
    response.cookie('admin_refresh_token', refreshTokenResult.token, cookieOptions);

    // Return response data
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      refreshToken: refreshTokenResult.token,
      refreshTokenExpiresAt: refreshTokenResult.expiresAt.toISOString(),
      admin: result.admin,
    };
  }

  /**
   * Refresh Access Token
   * Exchange a valid refresh token for a new access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchange a valid refresh token for a new access token and new refresh token (rotation).',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        expiresIn: { type: 'number' },
        refreshToken: { type: 'string' },
        refreshTokenExpiresAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(
    @Request() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Get refresh token from cookie
    const adminReq = req as AdminRequest;
    const refreshToken = adminReq.cookies?.admin_refresh_token;
    if (!refreshToken) {
      throw new AppException(ErrorCode.AUTH_REFRESH_TOKEN_MISSING);
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
      throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, { tokenType: 'refresh' }, 'Invalid refresh token');
    }

    // Get admin info
    const admin = await this.adminAuthService.getAdminById(tokenInfo.userId);
    if (!admin || !admin.is_active) {
      throw new AppException(ErrorCode.AUTH_ACCOUNT_INACTIVE, { adminId: tokenInfo.userId }, 'Admin account not found or inactive');
    }

    // Generate new access token
    const accessToken = await this.adminAuthService.signToken(admin);

    // Set new cookies
    const cookieOptions = this.getBaseCookieOptions(rotationResult.expiresAt);

    response.cookie('admin_access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    response.cookie('admin_refresh_token', rotationResult.token, cookieOptions);

    return {
      accessToken,
      expiresIn: 15 * 60, // 15 minutes
      refreshToken: rotationResult.token,
      refreshTokenExpiresAt: rotationResult.expiresAt.toISOString(),
    };
  }

  /**
   * Get Current Admin Profile
   * Requires valid JWT token
   */
  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @SkipEnvelope()
  @ApiOperation({
    summary: 'Get current admin profile',
    description: 'Returns the currently authenticated admin user information.',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getProfile(@Request() req: AdminRequest) {
    return req.admin;
  }

  /**
   * Change Password
   * Admin must provide current password to change it
   * Invalidates all other sessions for security
   */
  @Post('change-password')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  @ApiOperation({
    summary: 'Change admin password',
    description: 'Change the authenticated admin user password. Current password is required. Invalidates all other sessions.',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid current password' })
  @ApiResponse({ status: 400, description: 'New passwords do not match or validation error' })
  async changePassword(
    @Request() req: AdminRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    // Validate that new passwords match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      return {
        statusCode: 400,
        message: 'New passwords do not match',
        error: 'Bad Request',
      };
    }

    const result = await this.adminAuthService.changePassword(
      req.admin!.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    // Revoke all other sessions for security
    await this.refreshTokenService.revokeAllUserTokens(req.admin!.id);

    return result;
  }

  /**
   * Logout
   * Revokes refresh token and clears cookies
   */
  @Post('logout')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  @ApiOperation({
    summary: 'Logout',
    description: 'Logout endpoint. Revokes refresh token and clears cookies.',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Request() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Revoke refresh token from database if present
    const adminReq = req as AdminRequest;
    const refreshToken = adminReq.cookies?.admin_refresh_token;
    if (refreshToken) {
      const tokenInfo = await this.refreshTokenService.verifyRefreshToken(refreshToken);
      if (tokenInfo) {
        await this.refreshTokenService.revokeRefreshToken(tokenInfo.tokenId);
      }
    }

    // Clear httpOnly cookies (use same settings as login)
    const cookieOptions = this.getBaseCookieOptions();

    response.clearCookie('admin_access_token', cookieOptions);
    response.clearCookie('admin_refresh_token', cookieOptions);

    return {
      message: 'Logout successful. All tokens have been revoked.',
    };
  }

  /**
   * List Active Sessions
   * Get all active sessions for the current admin
   */
  @Get('sessions')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @SkipEnvelope()
  @ApiOperation({
    summary: 'List active sessions',
    description: 'Get all active sessions for the current admin user.',
  })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessions(@Request() req: AdminRequest) {
    const sessions = await this.refreshTokenService.getActiveSessionsWithUsername(req.admin!.id);

    return {
      sessions: sessions.map(s => ({
        id: s.id,
        created: s.created_at,
        expires: s.expires_at,
        ipAddress: s.ip_address,
        device: s.device_info?.device || 'unknown',
        browser: s.device_info?.browser || 'unknown',
        isCurrent: false, // Frontend will determine which is current
      })),
    };
  }

  /**
   * Revoke Session
   * Revoke a specific session
   */
  @Post('sessions/:tokenId/revoke')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  @ApiOperation({
    summary: 'Revoke a specific session',
    description: 'Revoke a specific session by ID.',
  })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async revokeSession(@Param('tokenId') tokenId: string) {
    const success = await this.refreshTokenService.revokeRefreshToken(tokenId);
    if (!success) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, { resource: 'session' }, 'Session not found or already revoked');
    }

    return {
      message: 'Session revoked successfully',
    };
  }

  /**
   * Revoke Other Sessions
   * Revoke all sessions except the current one
   */
  @Post('sessions/revoke-others')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  @ApiOperation({
    summary: 'Revoke all other sessions',
    description: 'Revoke all sessions except the current one.',
  })
  @ApiResponse({ status: 200, description: 'Sessions revoked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeOtherSessions(@Request() req: AdminRequest) {
    const currentRefreshToken = req.cookies?.admin_refresh_token;
    if (!currentRefreshToken) {
      throw new AppException(ErrorCode.AUTH_REFRESH_TOKEN_MISSING, undefined, 'No refresh token found');
    }

    const tokenInfo = await this.refreshTokenService.verifyRefreshToken(currentRefreshToken);
    if (!tokenInfo) {
      throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, { tokenType: 'refresh' }, 'Invalid refresh token');
    }

    const count = await this.refreshTokenService.revokeOtherSessions(req.admin!.id, tokenInfo.tokenId);

    return {
      message: `Revoked ${count} other session(s) successfully`,
    };
  }

  /**
   * Revoke All Sessions
   * Revoke all sessions including the current one (requires re-login)
   */
  @Post('sessions/revoke-all')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @SkipEnvelope()
  @ApiOperation({
    summary: 'Revoke all sessions',
    description: 'Revoke all sessions including the current one. Requires re-login.',
  })
  @ApiResponse({ status: 200, description: 'All sessions revoked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeAllSessions(@Request() req: AdminRequest) {
    const count = await this.refreshTokenService.revokeAllUserTokens(req.admin!.id);

    return {
      message: `Revoked all ${count} session(s) successfully`,
    };
  }
}
