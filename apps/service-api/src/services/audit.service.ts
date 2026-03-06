/**
 * Audit Logging Service
 * Manual logging for all write/update/delete operations from Admin panel
 */

import { supabaseAdmin } from '../config/supabase.js';
import { AuditAction, CreateAuditLogDto } from '@medical-portal/shared';

export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Log an audit entry
   */
  static async log(
    action: AuditAction,
    tableName: string,
    recordId: string,
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown> | null,
    context: AuditContext
  ): Promise<void> {
    try {
      const auditEntry: CreateAuditLogDto = {
        user_id: context.userId,
        action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData || undefined,
        new_data: newData || undefined,
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
      };

      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to write audit log:', error);
      }
    } catch (err) {
      console.error('Audit logging error:', err);
    }
  }

  /**
   * Log INSERT operation
   */
  static async logInsert(
    tableName: string,
    recordId: string,
    newData: Record<string, unknown>,
    context: AuditContext
  ): Promise<void> {
    await this.log(AuditAction.INSERT, tableName, recordId, null, newData, context);
  }

  /**
   * Log UPDATE operation
   */
  static async logUpdate(
    tableName: string,
    recordId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    context: AuditContext
  ): Promise<void> {
    await this.log(AuditAction.UPDATE, tableName, recordId, oldData, newData, context);
  }

  /**
   * Log DELETE operation
   */
  static async logDelete(
    tableName: string,
    recordId: string,
    oldData: Record<string, unknown>,
    context: AuditContext
  ): Promise<void> {
    await this.log(AuditAction.DELETE, tableName, recordId, oldData, null, context);
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getLogs(options: {
    userId?: string;
    tableName?: string;
    action?: AuditAction;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const {
      userId,
      tableName,
      action,
      startDate,
      endDate,
      page = 1,
      pageSize = 50,
    } = options;

    let query = supabaseAdmin
      .from('audit_logs')
      .select('*, profiles:user_id(full_name, email)', { count: 'exact' });

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (tableName) {
      query = query.eq('table_name', tableName);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  }
}

/**
 * Extract audit context from Express request
 */
export function getAuditContext(req: { user?: { id: string }; ip?: string; headers: Record<string, unknown> }): AuditContext {
  return {
    userId: req.user?.id,
    ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || undefined,
    userAgent: (req.headers['user-agent'] as string) || undefined,
  };
}
