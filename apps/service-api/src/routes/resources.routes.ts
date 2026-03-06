/**
 * Resources Routes
 */

import { Router, Response } from 'express';
import type { Router as RouterType } from 'express';
import { authMiddleware, adminOnlyMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AuditService, getAuditContext } from '../services/audit.service.js';

export const resourcesRouter: RouterType = Router();

/**
 * GET /api/resources
 */
resourcesRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lecture_id, type, is_active = 'true' } = req.query;

    let query = supabaseAdmin.from('resources').select('*');

    if (lecture_id) {
      query = query.eq('lecture_id', lecture_id);
    }
    if (type) {
      query = query.eq('type', type);
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
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch resources' },
    });
  }
});

/**
 * GET /api/resources/:id
 */
resourcesRouter.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    });
  }
});

/**
 * POST /api/resources
 */
resourcesRouter.post('/', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('resources')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    await AuditService.logInsert('resources', data.id, data, getAuditContext(req));

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: 'Failed to create resource' },
    });
  }
});

/**
 * PUT /api/resources/:id
 */
resourcesRouter.put('/:id', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: oldData } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('resources')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await AuditService.logUpdate('resources', id, oldData, data, getAuditContext(req));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update resource' },
    });
  }
});

/**
 * DELETE /api/resources/:id
 */
resourcesRouter.delete('/:id', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: oldData } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin.from('resources').delete().eq('id', id);

    if (error) throw error;

    await AuditService.logDelete('resources', id, oldData, getAuditContext(req));

    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete resource' },
    });
  }
});

/**
 * POST /api/resources/bulk
 * Create multiple resources at once
 */
resourcesRouter.post('/bulk', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resources } = req.body;

    const { data, error } = await supabaseAdmin
      .from('resources')
      .insert(resources)
      .select();

    if (error) throw error;

    // Log each insert
    for (const resource of data) {
      await AuditService.logInsert('resources', resource.id, resource, getAuditContext(req));
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'BULK_CREATE_ERROR', message: 'Failed to create resources' },
    });
  }
});

/**
 * PATCH /api/resources/reorder
 */
resourcesRouter.patch('/reorder', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body;

    for (const item of items) {
      await supabaseAdmin
        .from('resources')
        .update({ order_index: item.order_index })
        .eq('id', item.id);
    }

    res.json({ success: true, message: 'Resources reordered successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'REORDER_ERROR', message: 'Failed to reorder resources' },
    });
  }
});
