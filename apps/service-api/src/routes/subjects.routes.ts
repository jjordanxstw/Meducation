/**
 * Subjects Routes
 */

import { Router, Response } from 'express';
import type { Router as RouterType } from 'express';
import { authMiddleware, adminOnlyMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AuditService, getAuditContext } from '../services/audit.service.js';

export const subjectsRouter: RouterType = Router();

/**
 * GET /api/subjects
 * Get all subjects with optional filtering
 */
subjectsRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { year_level, is_active = 'true' } = req.query;

    let query = supabaseAdmin
      .from('subjects')
      .select('*');

    if (year_level) {
      query = query.eq('year_level', parseInt(year_level as string, 10));
    }

    if (is_active === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('order_index');

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch subjects' },
    });
  }
});

/**
 * GET /api/subjects/:id
 * Get subject with full hierarchy (sections, lectures, resources)
 */
subjectsRouter.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get subject
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (subjectError) throw subjectError;

    // Get sections with lectures and resources
    const { data: sections, error: sectionsError } = await supabaseAdmin
      .from('sections')
      .select(`
        *,
        lectures:lectures(
          *,
          resources:resources(*)
        )
      `)
      .eq('subject_id', id)
      .eq('is_active', true)
      .order('order_index');

    if (sectionsError) throw sectionsError;

    // Sort nested data
    const sortedSections = sections?.map(section => ({
      ...section,
      lectures: section.lectures
        ?.filter((l: { is_active: boolean }) => l.is_active)
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
        .map((lecture: { resources: Array<{ is_active: boolean; order_index: number }> }) => ({
          ...lecture,
          resources: lecture.resources
            ?.filter((r: { is_active: boolean }) => r.is_active)
            .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index),
        })),
    }));

    res.json({
      success: true,
      data: {
        ...subject,
        sections: sortedSections,
      },
    });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Subject not found' },
    });
  }
});

/**
 * POST /api/subjects
 * Create new subject (admin only)
 */
subjectsRouter.post('/', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await AuditService.logInsert('subjects', data.id, data, getAuditContext(req));

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: 'Failed to create subject' },
    });
  }
});

/**
 * PUT /api/subjects/:id
 * Update subject (admin only)
 */
subjectsRouter.put('/:id', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get old data for audit
    const { data: oldData } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await AuditService.logUpdate('subjects', id, oldData, data, getAuditContext(req));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update subject' },
    });
  }
});

/**
 * DELETE /api/subjects/:id
 * Delete subject (admin only)
 */
subjectsRouter.delete('/:id', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get old data for audit
    const { data: oldData } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await AuditService.logDelete('subjects', id, oldData, getAuditContext(req));

    res.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete subject' },
    });
  }
});

/**
 * PATCH /api/subjects/reorder
 * Reorder subjects (admin only)
 */
subjectsRouter.patch('/reorder', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body; // [{ id: string, order_index: number }]

    for (const item of items) {
      await supabaseAdmin
        .from('subjects')
        .update({ order_index: item.order_index })
        .eq('id', item.id);
    }

    res.json({
      success: true,
      message: 'Subjects reordered successfully',
    });
  } catch (error) {
    console.error('Reorder subjects error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REORDER_ERROR', message: 'Failed to reorder subjects' },
    });
  }
});
