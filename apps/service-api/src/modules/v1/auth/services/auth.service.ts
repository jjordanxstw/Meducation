/**
 * Auth Service
 * Handles Google OAuth verification, session management, and profile operations
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from '@medical-portal/shared';
import { UserWithoutPassword, Profile } from '../entities/profile.entity';
import { AuthTokenDto } from '../dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;
  private readonly supabaseAdmin: SupabaseClient;
  private readonly allowedEmailDomains: string[];
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new Error('GOOGLE_CLIENT_ID is required');
    }
    this.googleClient = new OAuth2Client(googleClientId);

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

    this.allowedEmailDomains = this.configService.get<string>('ALLOWED_EMAIL_DOMAINS', '@student.mahidol.edu,@student.mahidol.ac.th').split(',');
    this.jwtSecret = this.configService.get<string>('JWT_SECRET', 'dev-secret');
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1h');
  }

  /**
   * Verify Google ID Token
   */
  async verifyGoogleToken(idToken: string): Promise<TokenPayload | null> {
    try {
      const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      return ticket.getPayload() || null;
    } catch (error) {
      this.logger.error('Google token verification failed:', error);
      return null;
    }
  }

  /**
   * Sign a server session JWT
   */
  async signSessionToken(payload: Record<string, unknown>): Promise<string> {
    return this.jwtService.signAsync(payload, { secret: this.jwtSecret, expiresIn: this.jwtExpiresIn });
  }

  /**
   * Verify server session JWT
   */
  async verifySessionToken(token: string): Promise<Record<string, unknown> | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: this.jwtSecret });
      return payload as Record<string, unknown>;
    } catch (err) {
      this.logger.warn('Session token verify failed:', err);
      return null;
    }
  }

  /**
   * Check if email is from allowed domains
   */
  private isAllowedEmail(email: string, role?: UserRole): boolean {
    // Admins can have any email
    if (role === 'admin') {
      return true;
    }

    // Students must have Mahidol email
    return this.allowedEmailDomains.some(domain => email.endsWith(domain));
  }

  /**
   * Get or create user profile in database
   *
   * DEVELOPER NOTES: Database Constraints
   * =====================================
   *
   * 1. Email Domain Constraint (valid_mahidol_email):
   *    - The database has a CHECK constraint on the profiles.email column
   *    - Only allows emails from specific Mahidol University domains
   *    - Error code: '23514' (CHECK constraint violation)
   *    - Error message: "new row for relation 'profiles' violates check constraint 'valid_mahidol_email'"
   *
   * 2. Allowed Domains Configuration:
   *    - Configured via ALLOWED_EMAIL_DOMAINS environment variable
   *    - Default: '@student.mahidol.edu,@student.mahidol.ac.th'
   *    - To allow other domains during development, update this variable
   *
   * 3. Common Debugging Scenarios:
   *    a) User sees "valid_mahidol_email" error:
   *       - Check the email domain in the error log
   *       - Verify ALLOWED_EMAIL_DOMAINS includes that domain
   *       - For development: Add '@gmail.com' or other test domains
   *       - For production: Keep only Mahidol domains for security
   *
   *    b) Admin users bypassing domain check:
   *       - Set role='admin' when manually inserting into database
   *       - Admins can have any email domain (see isAllowedEmail method)
   *
   *    c) Error codes:
   *       - PGRST116: Profile not found (safe to create new)
   *       - 23514: CHECK constraint violation (email domain not allowed)
   *       - 23505: UNIQUE violation (userId already exists)
   *
   * 4. Testing with non-Mahidol emails:
   *    - Set ALLOWED_EMAIL_DOMAINS=@test.com,@gmail.com in .env
   *    - Or insert profile directly into database with admin role
   *
   * @param userId - Google OAuth subject identifier (unique per Google account)
   * @param email - User's email address (must match valid_mahidol_email constraint)
   * @param name - User's display name from Google profile
   * @returns Profile object if successful, null if creation fails
   */
  async getOrCreateProfile(
    userId: string,
    email: string,
    name: string
  ): Promise<Profile | null> {
    try {
      // Try to get existing profile
      const { data: existingProfile, error: fetchError } = await this.supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        return existingProfile as Profile;
      }

      // Create new profile if doesn't exist
      if (fetchError && fetchError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await this.supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            email,
            full_name: name,
            role: 'student' as UserRole,
            year_level: 1,
          })
          .select()
          .single();

        if (createError) {
          // Detailed error logging for constraint violations
          if (createError.code === '23514') {
            this.logger.error(
              `Database constraint violation: Email domain not allowed. ` +
              `Email: ${email}. ` +
              `Allowed domains: ${this.allowedEmailDomains.join(', ')}. ` +
              `To allow this domain, update ALLOWED_EMAIL_DOMAINS environment variable. ` +
              `For testing, you can add temporary domains like @gmail.com`,
              createError
            );
          } else if (createError.code === '23505') {
            this.logger.error(
              `Duplicate key violation: User ID ${userId} already exists in profiles table`,
              createError
            );
          } else {
            this.logger.error('Failed to create profile:', createError);
          }
          return null;
        }

        return newProfile as Profile;
      }

      return null;
    } catch (error) {
      this.logger.error('Profile operation failed:', error);
      return null;
    }
  }

  /**
   * Revoke a Google token
   */
  async revokeGoogleToken(token: string): Promise<boolean> {
    try {
      await this.googleClient.revokeToken(token);
      return true;
    } catch (error) {
      this.logger.error('Google token revocation failed:', error);
      return false;
    }
  }

  /**
   * Verify Google credential and create session
   *
   * FLOW:
   * 1. Verify Google ID token with Google's servers
   * 2. Get or create user profile in database
   * 3. Validate email domain (must match ALLOWED_EMAIL_DOMAINS)
   * 4. Sign server session JWT
   * 5. Return user data and session token
   *
   * If login fails with "valid_mahidol_email" constraint error, see
   * getOrCreateProfile() method documentation for debugging steps.
   */
  async verifyCredential(credential: string): Promise<{
    user: UserWithoutPassword;
    profile: Profile | null;
    sessionToken: string;
  }> {
    // Verify Google ID token
    const payload = await this.verifyGoogleToken(credential);
    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    // Get or create profile
    const profile = await this.getOrCreateProfile(
      payload.sub,
      payload.email,
      payload.name || payload.email.split('@')[0]
    );

    if (!profile) {
      throw new UnauthorizedException('Failed to create profile');
    }

    // Check email domain
    if (!this.isAllowedEmail(payload.email, profile?.role)) {
      throw new UnauthorizedException(
        `Access restricted to ${this.allowedEmailDomains.join(', ')} emails only. Your email: ${payload.email}`
      );
    }

    // Sign server session token
    const sessionPayload = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    const sessionToken = await this.signSessionToken(sessionPayload);

    const user: UserWithoutPassword = {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
      profile: profile || undefined,
    };

    return { user, profile, sessionToken };
  }

  /**
   * Get session from cookie
   */
  async getSessionFromCookie(sessionToken: string): Promise<UserWithoutPassword | null> {
    const sessionPayload = await this.verifySessionToken(sessionToken);
    if (!sessionPayload || !sessionPayload.sub) {
      return null;
    }

    // Fetch profile from DB
    const profile = await this.getOrCreateProfile(
      String(sessionPayload.sub),
      String(sessionPayload.email || ''),
      String(sessionPayload.name || '')
    );

    return {
      id: String(sessionPayload.sub),
      email: String(sessionPayload.email || ''),
      name: String(sessionPayload.name || ''),
      picture: String(sessionPayload.picture || ''),
      profile: profile || undefined,
    };
  }

  /**
   * Get session from Authorization header
   */
  async getSessionFromHeader(idToken: string): Promise<UserWithoutPassword | null> {
    const payload = await this.verifyGoogleToken(idToken);
    if (!payload || !payload.email || !payload.sub) {
      return null;
    }

    const profile = await this.getOrCreateProfile(
      payload.sub,
      payload.email,
      payload.name || payload.email.split('@')[0]
    );

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
      profile: profile || undefined,
    };
  }

  /**
   * Issue token for user
   */
  async issueToken(user: UserWithoutPassword): Promise<AuthTokenDto> {
    const expiresIn = this.getTokenTtlSeconds();
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    }, { secret: this.jwtSecret, expiresIn });

    return new AuthTokenDto(accessToken, expiresIn);
  }

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
