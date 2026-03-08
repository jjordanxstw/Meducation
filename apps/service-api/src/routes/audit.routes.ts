/**
 * Audit Logs Routes
 */

import { Router, Response } from 'express';
import type { Router as RouterType } from 'express';
import { authMiddleware, adminOnlyMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuditService } from '../services/audit.service.js';
import { AuditAction } from '@medical-portal/shared';

export const auditRouter: RouterType = Router();

/**
 * GET /api/audit-logs
 * Get audit logs (admin only)
 */
auditRouter.get('/', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      user_id,
      table_name,
      action,
      start_date,
      end_date,
      page = 1,
      pageSize = 50,
    } = req.query;

    const result = await AuditService.getLogs({
      userId: user_id as string,
      tableName: table_name as string,
      action: action as AuditAction,
      startDate: start_date as string,
      endDate: end_date as string,
      page: parseInt(page as string, 10),
      pageSize: parseInt(pageSize as string, 10),
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch audit logs' },
    });
  }
});

/**
 * GET /api/audit-logs/tables
 * Get list of tables with audit logs
 */
auditRouter.get('/tables', authMiddleware, adminOnlyMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: [
      'profiles',
      'subjects',
      'sections',
      'lectures',
      'resources',
      'calendar_events',
    ],
  });
});

/**
 * GET /api/audit-logs/record/:table/:id
 * Get audit history for a specific record
 */
auditRouter.get('/record/:table/:id', authMiddleware, adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { table, id } = req.params;

    const result = await AuditService.getLogs({
      tableName: table,
      page: 1,
      pageSize: 100,
    });

    // Filter by record_id
    const filteredData = result.data?.filter(
      (log: { record_id: string }) => log.record_id === id
    );

    res.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch record audit history' },
    });
  }
});
