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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminLoginDto, ChangePasswordDto } from '../dto';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';

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
}

@ApiTags('Admin Authentication')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  /**
   * Admin Login
   * Authenticate with username and password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin login',
    description: 'Authenticate admin user with username and password. Returns JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token' },
        expiresIn: { type: 'number', description: 'Token expiration in seconds' },
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
  async login(@Body() loginDto: AdminLoginDto) {
    const result = await this.adminAuthService.login(
      loginDto.username,
      loginDto.password,
    );

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      admin: result.admin,
    };
  }

  /**
   * Get Current Admin Profile
   * Requires valid JWT token
   */
  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
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
   */
  @Post('change-password')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change admin password',
    description: 'Change the authenticated admin user password. Current password is required.',
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

    return result;
  }

  /**
   * Logout (Client-side only)
   * Tokens are stateless, so logout is handled by client
   */
  @Post('logout')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout',
    description: 'Logout endpoint (tokens are stateless, client should discard token)',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    return {
      message: 'Logout successful. Please discard your token.',
    };
  }
}
