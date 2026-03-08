/**
 * Google Auth Middleware
 * Validates Google ID tokens and enforces Mahidol email restriction
 */

import { Request, Response, NextFunction } from 'express';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import type { Profile, UserRole } from '@medical-portal/shared';

// Initialize Google OAuth2 client
const googleClient = new OAuth2Client(config.googleClientId);

// Extended Request type with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    profile?: Profile;
  };
}

/**
 * Verify Google ID Token
 */
export async function verifyGoogleToken(idToken: string): Promise<TokenPayload | null> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });
    return ticket.getPayload() || null;
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}

// Exported utility to sign a server session JWT
export function signSessionToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
}

// Exported utility to verify server session JWT
export function verifySessionToken(token: string): Record<string, unknown> | null {
  try {
    return jwt.verify(token, config.jwtSecret) as Record<string, unknown>;
  } catch (err) {
    console.warn('Session token verify failed:', err);
    return null;
  }
}

/**
 * Check if email is from allowed Mahidol domain
 */
function isAllowedEmail(email: string, role?: UserRole): boolean {
  // Admins can have any email
  if (role === 'admin') {
    return true;
  }
  
  // Students must have Mahidol email (check against all allowed domains)
  return config.allowedEmailDomain.some(domain => email.endsWith(domain));
}

/**
 * Get or create user profile in database
 */
async function getOrCreateProfile(
  userId: string,
  email: string,
  name: string
): Promise<Profile | null> {
  try {
    // Try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return existingProfile as Profile;
    }

    // Create new profile if doesn't exist
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabaseAdmin
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
        console.error('Failed to create profile:', createError);
        return null;
      }

      return newProfile as Profile;
    }

    return null;
  } catch (error) {
    console.error('Profile operation failed:', error);
    return null;
  }
}

export { getOrCreateProfile };

/**
 * Authentication Middleware
 * Validates Google ID Token from Authorization header
 * 
 * Header format: Authorization: Bearer <google_id_token>
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1) If Authorization Bearer <google id token> header is present, verify it
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.substring(7);
      const payload = await verifyGoogleToken(idToken);

      if (!payload || !payload.email || !payload.sub) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid or expired Google ID token' },
        });
        return;
      }

      const profile = await getOrCreateProfile(
        payload.sub,
        payload.email,
        payload.name || payload.email.split('@')[0]
      );

      if (!isAllowedEmail(payload.email, profile?.role)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'EMAIL_DOMAIN_RESTRICTED',
            message: `Access restricted to ${config.allowedEmailDomain} emails only. Your email: ${payload.email}`,
          },
        });
        return;
      }

      req.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
        profile: profile || undefined,
      };

      next();
      return;
    }

    // 2) Otherwise try server session cookie
    const cookieName = config.sessionCookieName;
    const cookieHeader = req.headers.cookie;
    let sessionToken: string | undefined;
    if (cookieHeader) {
      // simple parse
      const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`));
      if (match) sessionToken = match.substring(cookieName.length + 1);
    }

    if (!sessionToken) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authentication' } });
      return;
    }

    const sessionPayload = verifySessionToken(sessionToken);
    if (!sessionPayload || !sessionPayload.sub) {
      res.status(401).json({ success: false, error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
      return;
    }

    // Fetch profile from DB
    const profile = await getOrCreateProfile(String(sessionPayload.sub), String(sessionPayload.email || ''), String(sessionPayload.name || ''));

    req.user = {
      id: String(sessionPayload.sub),
      email: String(sessionPayload.email || ''),
      name: String(sessionPayload.name || ''),
      picture: String(sessionPayload.picture || ''),
      profile: profile || undefined,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication processing failed',
      },
    });
  }
}

/**
 * Revoke a Google token (ID or refresh token).
 * Returns true if revocation request was sent successfully, false otherwise.
 * Note: Google may return success even for already-expired/invalid tokens.
 */
export async function revokeGoogleToken(token: string): Promise<boolean> {
  try {
    // OAuth2Client.revokeToken works for refresh tokens and access tokens.
    // For ID tokens it will trigger Google's revocation endpoint which may
    // return success even if token is already expired — that's acceptable
    // for logout flows where the client should clear local tokens.
    await googleClient.revokeToken(token);
    return true;
  } catch (error) {
    console.error('Google token revocation failed:', error);
    // Treat as non-fatal for logout flows — caller may still clear client state.
    return false;
  }
}

/**
 * Admin-only Middleware
 * Must be used after authMiddleware
 */
export function adminOnlyMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.profile || req.user.profile.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'This action requires administrator privileges',
      },
    });
    return;
  }

  next();
}

/**
 * Optional Auth Middleware
 * Attaches user if token is present, but doesn't require it
 */
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.substring(7);
    const payload = await verifyGoogleToken(idToken);

    if (payload && payload.email && payload.sub) {
      const profile = await getOrCreateProfile(
        payload.sub,
        payload.email,
        payload.name || payload.email.split('@')[0]
      );

      req.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
        profile: profile || undefined,
      };
    }
  } else {
    // Try server session cookie
    const cookieName = config.sessionCookieName;
    const cookieHeader = req.headers.cookie;
    let sessionToken: string | undefined;
    if (cookieHeader) {
      const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`));
      if (match) sessionToken = match.substring(cookieName.length + 1);
    }

    if (sessionToken) {
      const sessionPayload = verifySessionToken(sessionToken);
      if (sessionPayload && sessionPayload.sub) {
        const profile = await getOrCreateProfile(String(sessionPayload.sub), String(sessionPayload.email || ''), String(sessionPayload.name || ''));
        req.user = {
          id: String(sessionPayload.sub),
          email: String(sessionPayload.email || ''),
          name: String(sessionPayload.name || ''),
          picture: String(sessionPayload.picture || ''),
          profile: profile || undefined,
        };
      }
    }
  }

  next();
}
