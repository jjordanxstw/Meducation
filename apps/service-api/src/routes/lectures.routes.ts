/**
 * Lectures Routes
 */

import { Router, Response } from 'express';
import type { Router as RouterType } from 'express';
import { authMiddleware, adminOnlyMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AuditService, getAuditContext } from '../services/audit.service.js';

export const lecturesRouter: RouterType = Router();

/**
 * GET /api/lectures
 */
lecturesRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { section_id, is_active = 'true' } = req.query;

    let query = supabaseAdmin.from('lectures').select('*');

    if (section_id) {
      query = query.eq('section_id', section_id);
    }
    if (is_active === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('order_index');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch lectures' },
    });
  }
});

/**
 * GET /api/lectures/:id
 */
lecturesRouter.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('lectures')
      .select(`*, resources:resources(*)`)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Sort resources by order_index
    if (data.resources) {
      data.resources.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index);
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Lecture not found' },
    });
  }
});

/**
 * POST /api/lectures
 */
lecturesRouter.post('/', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lectures')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    await AuditService.logInsert('lectures', data.id, data, getAuditContext(req));

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: 'Failed to create lecture' },
    });
  }
});

/**
 * PUT /api/lectures/:id
 */
lecturesRouter.put('/:id', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: oldData } = await supabaseAdmin
      .from('lectures')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('lectures')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await AuditService.logUpdate('lectures', id, oldData, data, getAuditContext(req));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update lecture' },
    });
  }
});

/**
 * DELETE /api/lectures/:id
 */
lecturesRouter.delete('/:id', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: oldData } = await supabaseAdmin
      .from('lectures')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin.from('lectures').delete().eq('id', id);

    if (error) throw error;

    await AuditService.logDelete('lectures', id, oldData, getAuditContext(req));

    res.json({ success: true, message: 'Lecture deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete lecture' },
    });
  }
});

/**
 * PATCH /api/lectures/reorder
 */
lecturesRouter.patch('/reorder', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body;

    for (const item of items) {
      await supabaseAdmin
        .from('lectures')
        .update({ order_index: item.order_index })
        .eq('id', item.id);
    }

    res.json({ success: true, message: 'Lectures reordered successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'REORDER_ERROR', message: 'Failed to reorder lectures' },
    });
  }
});
