/**
 * Refresh Token Service for Students
 * Handles refresh token generation, validation, rotation, and revocation
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes, createHash } from 'crypto';
import { AppException } from '../../../../common/errors';
import { ErrorCode } from '@medical-portal/shared';

export interface RefreshTokenMetadata {
  userId: string;
  userType: 'student';
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, string>;
}

export interface RefreshTokenResult {
  token: string;
  expiresAt: Date;
}

export interface SessionInfo {
  id: string;
  userId: string;
  created_at: string;
  expires_at: string;
  ip_address: string | null;
  device_info: {
    device: string;
    browser: string;
  };
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly supabaseAdmin: SupabaseClient;
  private readonly refreshExpiresIn: number; // in seconds

  constructor(private configService: ConfigService) {
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

    // Default to 7 days for refresh tokens
    this.refreshExpiresIn = 7 * 24 * 60 * 60;
  }

  /**
   * Generate a secure refresh token
   * Creates 256-bit random token and stores hash in database
   */
  async generateRefreshToken(metadata: RefreshTokenMetadata): Promise<RefreshTokenResult> {
    // Generate secure random token (256 bits)
    const token = randomBytes(32).toString('base64url');

    // Hash the token before storing (SHA-256)
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.refreshExpiresIn);

    // Store in database
    const { error } = await this.supabaseAdmin
      .from('refresh_tokens')
      .insert({
        user_id: metadata.userId,
        user_type: 'student',
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        ip_address: metadata.ipAddress || null,
        user_agent: metadata.userAgent || null,
        device_info: metadata.deviceInfo || { device: 'unknown', browser: 'unknown' },
      });

    if (error) {
      this.logger.warn(`Failed to store refresh token (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'refresh_token' }, 'Failed to create refresh token');
    }

    this.logger.log(`Refresh token created for user ${metadata.userId}`);

    return {
      token,
      expiresAt,
    };
  }

  /**
   * Verify and rotate a refresh token
   * Returns new access token and new refresh token (rotation)
   */
  async rotateRefreshToken(
    oldToken: string,
    metadata: Partial<RefreshTokenMetadata>
  ): Promise<RefreshTokenResult> {
    // Hash the old token
    const oldTokenHash = createHash('sha256').update(oldToken).digest('hex');

    // Find the token in database
    const { data: existingToken, error } = await this.supabaseAdmin
      .from('refresh_tokens')
      .select('*')
      .eq('token_hash', oldTokenHash)
      .eq('user_type', 'student')
      .single();

    if (error || !existingToken) {
      throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, { tokenType: 'refresh' }, 'Invalid or expired refresh token');
    }

    // Check if token is not revoked and not expired
    if (existingToken.revoked_at) {
      throw new AppException(ErrorCode.AUTH_TOKEN_REVOKED, { tokenType: 'refresh' }, 'Refresh token has been revoked');
    }

    if (new Date(existingToken.expires_at) < new Date()) {
      throw new AppException(ErrorCode.AUTH_TOKEN_EXPIRED, { tokenType: 'refresh' }, 'Refresh token has expired');
    }

    // Revoke the old token (mark as replaced by new token)
    const { error: revokeError } = await this.supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', existingToken.id);

    if (revokeError) {
      this.logger.warn(`Failed to revoke old refresh token (code=${revokeError.code ?? 'unknown'})`);
    }

    // Generate new refresh token
    const userId = existingToken.user_id;
    return this.generateRefreshToken({
      userId,
      userType: 'student',
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      deviceInfo: metadata.deviceInfo,
    });
  }

  /**
   * Verify a refresh token (without rotating)
   */
  async verifyRefreshToken(token: string): Promise<{ userId: string; tokenId: string } | null> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const { data, error } = await this.supabaseAdmin
      .from('refresh_tokens')
      .select('id, user_id')
      .eq('token_hash', tokenHash)
      .eq('user_type', 'student')
      .is('revoked_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return {
      userId: data.user_id,
      tokenId: data.id,
    };
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(tokenId: string): Promise<boolean> {
    const { error } = await this.supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', tokenId)
      .eq('user_type', 'student');

    if (error) {
      this.logger.warn(`Failed to revoke refresh token (code=${error.code ?? 'unknown'})`);
      return false;
    }

    return true;
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    const { data, error } = await this.supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('user_type', 'student')
      .is('revoked_at', null)
      .gte('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      this.logger.warn(`Failed to revoke all tokens (code=${error.code ?? 'unknown'})`);
      return 0;
    }

    this.logger.log(`Revoked all tokens for user ${userId}`);
    return data?.length ?? 0;
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<SessionInfo[]> {
    type SessionRow = {
      id: string;
      user_id: string;
      created_at: string;
      expires_at: string;
      ip_address: string | null;
      device_info: { device: string; browser: string } | null;
    };

    const { data, error } = await this.supabaseAdmin
      .from('refresh_tokens')
      .select('id, user_id, created_at, expires_at, ip_address, device_info')
      .eq('user_id', userId)
      .eq('user_type', 'student')
      .is('revoked_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .returns<SessionRow[]>();

    if (error) {
      this.logger.warn(`Failed to fetch active sessions (code=${error.code ?? 'unknown'})`);
      return [];
    }

    return (data || []).map((session: SessionRow): SessionInfo => ({
      id: session.id,
      userId: session.user_id,
      created_at: session.created_at,
      expires_at: session.expires_at,
      ip_address: session.ip_address,
      device_info: session.device_info || { device: 'unknown', browser: 'unknown' },
    }));
  }

  /**
   * Clean up expired and old revoked tokens
   * Should be run periodically (e.g., daily/weekly)
   */
  async cleanupOldTokens(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await this.supabaseAdmin.rpc('cleanup_expired_tokens');

    if (error) {
      this.logger.warn(`Failed to cleanup old tokens (code=${error.code ?? 'unknown'})`);
      return 0;
    }

    const count = data as number;
    if (count > 0) {
      this.logger.log(`Cleaned up ${count} old tokens`);
    }

    return count;
  }

  /**
   * Check if a session is still valid
   */
  async isSessionValid(userId: string, tokenId: string): Promise<boolean> {
    const { data, error } = await this.supabaseAdmin
      .from('refresh_tokens')
      .select('id')
      .eq('id', tokenId)
      .eq('user_id', userId)
      .eq('user_type', 'student')
      .is('revoked_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();

    return !error && !!data;
  }

  /**
   * Revoke all sessions except the current one
   */
  async revokeOtherSessions(userId: string, currentTokenId: string): Promise<number> {
    const { data, error } = await this.supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('user_type', 'student')
      .is('revoked_at', null)
      .neq('id', currentTokenId)
      .gte('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      this.logger.warn(`Failed to revoke other sessions (code=${error.code ?? 'unknown'})`);
      return 0;
    }

    const count = data?.length ?? 0;
    if (count > 0) {
      this.logger.log(`Revoked ${count} other sessions for user ${userId}`);
    }

    return count;
  }
}
