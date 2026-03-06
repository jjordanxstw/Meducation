/**
 * Sections Routes
 */

import { Router, Response } from 'express';
import type { Router as RouterType } from 'express';
import { authMiddleware, adminOnlyMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AuditService, getAuditContext } from '../services/audit.service.js';

export const sectionsRouter: RouterType = Router();

/**
 * GET /api/sections
 * Get sections by subject
 */
sectionsRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subject_id, is_active = 'true' } = req.query;

    let query = supabaseAdmin.from('sections').select('*');

    if (subject_id) {
      query = query.eq('subject_id', subject_id);
    }
    if (is_active === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('order_index');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch sections' },
    });
  }
});

/**
 * GET /api/sections/:id
 */
sectionsRouter.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('sections')
      .select(`*, lectures:lectures(*, resources:resources(*))`)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Section not found' },
    });
  }
});

/**
 * POST /api/sections
 */
sectionsRouter.post('/', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('sections')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    await AuditService.logInsert('sections', data.id, data, getAuditContext(req));

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: 'Failed to create section' },
    });
  }
});

/**
 * PUT /api/sections/:id
 */
sectionsRouter.put('/:id', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: oldData } = await supabaseAdmin
      .from('sections')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('sections')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await AuditService.logUpdate('sections', id, oldData, data, getAuditContext(req));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update section' },
    });
  }
});

/**
 * DELETE /api/sections/:id
 */
sectionsRouter.delete('/:id', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: oldData } = await supabaseAdmin
      .from('sections')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin.from('sections').delete().eq('id', id);

    if (error) throw error;

    await AuditService.logDelete('sections', id, oldData, getAuditContext(req));

    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete section' },
    });
  }
});

/**
 * PATCH /api/sections/reorder
 */
sectionsRouter.patch('/reorder', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body;

    for (const item of items) {
      await supabaseAdmin
        .from('sections')
        .update({ order_index: item.order_index })
        .eq('id', item.id);
    }

    res.json({ success: true, message: 'Sections reordered successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'REORDER_ERROR', message: 'Failed to reorder sections' },
    });
  }
});
