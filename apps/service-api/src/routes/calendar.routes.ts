/**
 * Calendar Routes
 */

import { Router, Response } from 'express';
import type { Router as RouterType } from 'express';
import { authMiddleware, adminOnlyMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AuditService, getAuditContext } from '../services/audit.service.js';

export const calendarRouter: RouterType = Router();

/**
 * GET /api/calendar
 * Get calendar events with optional filtering
 */
calendarRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { start_date, end_date, type, subject_id } = req.query;

    let query = supabaseAdmin
      .from('calendar_events')
      .select('*, subjects:subject_id(name, code)');

    if (start_date) {
      query = query.gte('start_time', start_date);
    }
    if (end_date) {
      query = query.lte('end_time', end_date);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (subject_id) {
      query = query.eq('subject_id', subject_id);
    }

    const { data, error } = await query.order('start_time');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch calendar events' },
    });
  }
});

/**
 * GET /api/calendar/month/:year/:month
 * Get events for a specific month
 */
calendarRouter.get('/month/:year/:month', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .select('*, subjects:subject_id(name, code)')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch calendar events' },
    });
  }
});

/**
 * GET /api/calendar/upcoming
 * Get upcoming events
 */
calendarRouter.get('/upcoming', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .select('*, subjects:subject_id(name, code)')
      .gte('start_time', now)
      .order('start_time')
      .limit(parseInt(limit as string, 10));

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch upcoming events' },
    });
  }
});

/**
 * GET /api/calendar/:id
 */
calendarRouter.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .select('*, subjects:subject_id(name, code)')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Calendar event not found' },
    });
  }
});

/**
 * POST /api/calendar
 */
calendarRouter.post('/', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const eventData = {
      ...req.body,
      created_by: req.user?.id,
    };

    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .insert(eventData)
      .select()
      .single();

    if (error) throw error;

    await AuditService.logInsert('calendar_events', data.id, data, getAuditContext(req));

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: 'Failed to create calendar event' },
    });
  }
});

/**
 * PUT /api/calendar/:id
 */
calendarRouter.put('/:id', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: oldData } = await supabaseAdmin
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await AuditService.logUpdate('calendar_events', id, oldData, data, getAuditContext(req));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update calendar event' },
    });
  }
});

/**
 * DELETE /api/calendar/:id
 */
calendarRouter.delete('/:id', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: oldData } = await supabaseAdmin
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin.from('calendar_events').delete().eq('id', id);

    if (error) throw error;

    await AuditService.logDelete('calendar_events', id, oldData, getAuditContext(req));

    res.json({ success: true, message: 'Calendar event deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete calendar event' },
    });
  }
});
