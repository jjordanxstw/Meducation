/**
 * Admin Auth Service
 * Handles admin authentication with username/password
 * Separate from student OAuth authentication
 */

import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AdminResponse,
  sanitizeAdmin,
} from '../entities/admin.entity';
import { ChangePasswordResponseDto } from '../dto';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  private readonly supabaseAdmin: SupabaseClient;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }
    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.jwtSecret = this.configService.get<string>('JWT_SECRET', 'dev-secret');
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1h');
  }

  /**
   * Admin Login
   * Validates username and password, returns JWT token
   */
  async login(username: string, password: string): Promise<{
    admin: AdminResponse;
    accessToken: string;
    expiresIn: number;
  }> {
    // Fetch admin with password hash
    const { data: admin, error } = await this.supabaseAdmin
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !admin) {
      this.logger.warn(`Admin login failed: User "${username}" not found`);
      throw new UnauthorizedException('Invalid username or password');
    }

    // Check if admin is active
    if (!admin.is_active) {
      this.logger.warn(`Admin login failed: User "${username}" is inactive`);
      throw new UnauthorizedException('Account is inactive. Please contact system administrator.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      this.logger.warn(`Admin login failed: Invalid password for user "${username}"`);
      throw new UnauthorizedException('Invalid username or password');
    }

    // Update last login timestamp
    await this.supabaseAdmin
      .from('admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id);

    // Generate JWT token
    const payload = {
      sub: admin.id,
      username: admin.username,
      type: 'admin', // Distinguish from student tokens
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    this.logger.log(`Admin "${username}" logged in successfully`);

    return {
      admin: sanitizeAdmin(admin),
      accessToken,
      expiresIn: this.getTokenTtlSeconds(),
    };
  }

  /**
   * Verify Admin JWT Token
   */
  async verifyToken(token: string): Promise<AdminResponse | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.jwtSecret,
      });

      // Check if this is an admin token
      if (payload.type !== 'admin' || !payload.sub) {
        return null;
      }

      // Fetch admin from database
      const { data: admin, error } = await this.supabaseAdmin
        .from('admins')
        .select('*')
        .eq('id', payload.sub)
        .single();

      if (error || !admin || !admin.is_active) {
        return null;
      }

      return sanitizeAdmin(admin);
    } catch (error) {
      this.logger.warn('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Change Password
   * Admin must provide current password to change it
   */
  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResponseDto> {
    // Fetch admin with password hash
    const { data: admin, error } = await this.supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', adminId)
      .single();

    if (error || !admin) {
      throw new UnauthorizedException('Admin not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, admin.password_hash);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const { error: updateError } = await this.supabaseAdmin
      .from('admins')
      .update({
        password_hash: newPasswordHash,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', adminId);

    if (updateError) {
      this.logger.error('Failed to update password:', updateError);
      throw new Error('Failed to update password');
    }

    this.logger.log(`Password changed for admin "${admin.username}"`);

    return new ChangePasswordResponseDto(
      'Password changed successfully',
      new Date(),
    );
  }

  /**
   * Get Admin by ID
   */
  async getAdminById(adminId: string): Promise<AdminResponse | null> {
    const { data: admin, error } = await this.supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', adminId)
      .single();

    if (error || !admin) {
      return null;
    }

    return sanitizeAdmin(admin);
  }

  /**
   * Get token TTL in seconds
   */
  private getTokenTtlSeconds(): number {
    const raw = this.jwtExpiresIn;
    const fallbackSeconds = 60 * 60; // 1 hour
    const trimmed = raw.trim();
    const durationMatch = /^([0-9]+)([smhd]?)$/i.exec(trimmed);

    if (!durationMatch) {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : fallbackSeconds;
    }

    const amount = Number(durationMatch[1]);
    const unit = durationMatch[2]?.toLowerCase();

    switch (unit) {
      case 's':
      case undefined:
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        return fallbackSeconds;
    }
  }
}
