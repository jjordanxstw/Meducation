/**
 * Auth Routes
 */

import { Router, Response } from 'express';
import type { Router as RouterType } from 'express';
import { authMiddleware, AuthenticatedRequest, revokeGoogleToken, verifyGoogleToken, signSessionToken, getOrCreateProfile } from '../middleware/auth.middleware.js';
import { config } from '../config/env.js';
import { WatermarkService } from '../services/watermark.service.js';

export const authRouter: RouterType = Router();

/**
 * POST /api/auth/verify
 * Verify Google token and return user session
 */
authRouter.post('/verify', async (req, res: Response) => {
  try {
    const credential = (req.body && req.body.credential) || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.substring(7) : undefined);

    if (!credential) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_CREDENTIAL', message: 'Missing credential' } });
    }

    // Verify Google ID token
    const payload = await verifyGoogleToken(credential);
    if (!payload || !payload.sub || !payload.email) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_GOOGLE_TOKEN', message: 'Invalid Google token' } });
    }

    // Get or create profile
    const profile = await getOrCreateProfile(payload.sub, payload.email, payload.name || payload.email.split('@')[0]);

    // Sign server session token
    const sessionPayload = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    const sessionToken = signSessionToken(sessionPayload);

    // Set httpOnly secure cookie
    res.cookie(config.sessionCookieName, sessionToken, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: 'lax',
      maxAge: config.sessionCookieMaxAgeMs,
    });

    return res.json({
      success: true,
      data: {
        user: { id: payload.sub, email: payload.email, name: payload.name, picture: payload.picture },
        profile,
      },
    });
  } catch (error) {
    console.error('Auth verify error:', error);
    res.status(500).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Failed to verify authentication' } });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
authRouter.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

/**
 * GET /api/auth/watermark
 * Get watermark configuration for current user
 */
authRouter.get('/watermark', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !req.user.profile) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User profile not found' },
    });
  }

  const watermarkPayload = WatermarkService.generatePayload({
    id: req.user.id,
    email: req.user.email,
    fullName: req.user.profile.full_name,
    studentId: req.user.profile.student_id || undefined,
  });

  res.json({
    success: true,
    data: watermarkPayload,
  });
});

/**
 * POST /api/auth/logout
 * Revoke token at Google (if possible) and return success regardless of
 * whether token was already expired/invalid. This makes logout idempotent
 * and friendly for clients that may present expired tokens when re-entering.
 */
authRouter.post('/logout', async (req, res: Response) => {
  try {
    // Optionally revoke Google token if provided
    const providedToken: string | undefined = (req.body && (req.body.token as string)) || undefined;
    if (providedToken) {
      try {
        await revokeGoogleToken(providedToken);
      } catch (e) {
        console.warn('revocation failed', e);
      }
    }

    // Clear server session cookie
    res.clearCookie(config.sessionCookieName, { httpOnly: true, secure: !config.isDev, sameSite: 'lax' });

    return res.json({ success: true, data: { message: 'Logged out' } });
  } catch (error) {
    console.error('Logout route error:', error);
    res.clearCookie(config.sessionCookieName, { httpOnly: true, secure: !config.isDev, sameSite: 'lax' });
    return res.json({ success: true, data: { message: 'Logged out' } });
  }
});
