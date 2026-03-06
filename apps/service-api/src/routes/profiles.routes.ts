/**
 * Profiles Routes
 */

import { Router, Response } from 'express';
import type { Router as RouterType } from 'express';
import { authMiddleware, adminOnlyMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AuditService, getAuditContext } from '../services/audit.service.js';

export const profilesRouter: RouterType = Router();

/**
 * GET /api/profiles
 * Get all profiles (admin only)
 */
profilesRouter.get('/', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 20, role, year_level } = req.query;
    
    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }
    if (year_level) {
      query = query.eq('year_level', parseInt(year_level as string, 10));
    }

    const from = (Number(page) - 1) * Number(pageSize);
    const to = from + Number(pageSize) - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(pageSize)),
      },
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch profiles' },
    });
  }
});

/**
 * GET /api/profiles/:id
 * Get profile by ID
 */
profilesRouter.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Profile not found' },
    });
  }
});

/**
 * PATCH /api/profiles/:id
 * Update profile
 */
profilesRouter.patch('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Users can only update their own profile unless admin
    if (req.user?.id !== id && req.user?.profile?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only update your own profile' },
      });
    }

    // Get old data for audit
    const { data: oldData } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the update
    await AuditService.logUpdate('profiles', id, oldData, data, getAuditContext(req));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update profile' },
    });
  }
});
