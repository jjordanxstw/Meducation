/**
 * Audit Service
 * Handles audit logging
 */

import { isIP } from 'net';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuditAction } from '@medical-portal/shared';
import { ErrorCode } from '@medical-portal/shared';
import { CursorPaginationMeta, encodeCursor, decodeCursor } from '@medical-portal/shared';
import { AppException } from '../../../../common/errors';

export interface AuditContext {
  userId: string;
  email: string;
  ip: string;
  userAgent: string;
}

export interface GetLogsParams {
  userId?: string;
  tableName?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }
    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  private resolveSort(
    sortBy?: string,
    sortOrder?: string,
  ): { field: string; ascending: boolean } {
    const allowed = new Set(['table_name', 'action', 'record_id', 'old_data', 'new_data', 'created_at']);
    const field = sortBy && allowed.has(sortBy) ? sortBy : 'created_at';
    const normalizedOrder = (sortOrder || '').toLowerCase();
    const ascending = normalizedOrder === 'asc' || normalizedOrder === 'ascend';
    return { field, ascending };
  }

  // Apply the shared filter set used by both offset and cursor pagination.
  // Typed as `any` because Supabase's chained builder type is too deep for the
  // generic to resolve without TS2589.
  private applyLogFilters(
    query: any,
    params: Pick<GetLogsParams, 'userId' | 'tableName' | 'action' | 'startDate' | 'endDate' | 'search'>,
  ): any {
    let q = query;
    if (params.userId) q = q.eq('user_id', params.userId);
    if (params.tableName) q = q.eq('table_name', params.tableName);
    if (params.action) q = q.eq('action', params.action);
    if (params.startDate) q = q.gte('created_at', params.startDate);
    if (params.endDate) q = q.lte('created_at', params.endDate);
    if (params.search?.trim()) {
      const term = params.search.trim();
      // PostgREST's or= filter is comma/paren-delimited, so double-quote the
      // pattern to keep those characters in the term from breaking the syntax.
      const pattern = `"%${term.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}%"`;
      const clauses = [
        `table_name.ilike.${pattern}`,
        `record_id.ilike.${pattern}`,
        `user_email.ilike.${pattern}`,
      ];
      // `action` is a Postgres enum and `ip_address` is inet; ilike only works
      // on text, so match these with exact operators instead.
      const actions = Object.values(AuditAction).filter((action) =>
        action.toLowerCase().includes(term.toLowerCase()),
      );
      if (actions.length > 0) {
        clauses.push(`action.in.(${actions.join(',')})`);
      }
      if (isIP(term)) {
        clauses.push(`ip_address.eq.${term}`);
      }
      q = q.or(clauses.join(','));
    }
    return q;
  }

  /**
   * Cursor-based pagination over audit logs, keyset-ordered by (created_at, id)
   * descending. Returns an opaque nextCursor for the following page.
   */
  async getLogsByCursor(
    params: Pick<GetLogsParams, 'userId' | 'tableName' | 'action' | 'startDate' | 'endDate' | 'search'> & {
      cursor?: string;
      limit: number;
    },
  ): Promise<{ data: unknown[]; meta: CursorPaginationMeta }> {
    const limit = Math.min(100, Math.max(1, params.limit || 50));

    let query = this.applyLogFilters(
      this.supabaseAdmin.from('audit_logs').select('*', { count: 'exact' }),
      params,
    );

    if (params.cursor) {
      const decoded = decodeCursor(params.cursor);
      if (!decoded) {
        throw new AppException(ErrorCode.VALIDATION_INVALID_INPUT, { field: 'cursor' }, 'Invalid pagination cursor');
      }
      // Rows strictly "after" the cursor in (created_at DESC, id DESC) order.
      query = query.or(
        `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`,
      );
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (error) {
      this.logger.warn(`Failed to fetch audit logs by cursor (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'audit_log' }, 'Failed to fetch audit logs');
    }

    const rows = (data || []) as Array<Record<string, any>>;
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor = hasMore && last ? encodeCursor({ id: last.id, createdAt: last.created_at }) : null;

    return {
      data: page.map((row) => ({ ...row, old_values: row.old_data, new_values: row.new_data })),
      meta: { nextCursor, hasMore, total: count ?? undefined },
    };
  }

  async getLogs(params: GetLogsParams) {
    const {
      userId,
      tableName,
      action,
      startDate,
      endDate,
      search,
      page = 1,
      pageSize = 50,
      sortBy,
      sortOrder,
    } = params;

    const query = this.applyLogFilters(
      this.supabaseAdmin.from('audit_logs').select('*', { count: 'exact' }),
      { userId, tableName, action, startDate, endDate, search },
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const sort = this.resolveSort(sortBy, sortOrder);

    const { data, error, count } = await query
      .order(sort.field, { ascending: sort.ascending })
      .range(from, to);

    if (error) {
      this.logger.warn(`Failed to fetch audit logs (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'audit_log' }, 'Failed to fetch audit logs');
    }

    return {
      data: (data || []).map((row: any) => ({
        ...row,
        old_values: row.old_data,
        new_values: row.new_data,
      })),
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  }

  async getTables() {
    return [
      'profiles',
      'subjects',
      'sections',
      'lectures',
      'resources',
      'calendar_events',
    ];
  }

  async getRecordHistory(tableName: string, recordId: string) {
    const result = await this.getLogs({
      tableName,
      page: 1,
      pageSize: 100,
    });

    // Filter by record_id
    const filteredData = result.data?.filter(
      (log: { record_id: string }) => log.record_id === recordId
    );

    return filteredData;
  }

  // These methods are called from other services
  async logInsert(tableName: string, recordId: string, newData: any, context: AuditContext) {
    await this.supabaseAdmin.from('audit_logs').insert({
      table_name: tableName,
      record_id: recordId,
      action: AuditAction.INSERT,
      new_data: newData,
      user_id: context.userId,
      user_email: context.email,
      ip_address: context.ip,
      user_agent: context.userAgent,
    });
  }

  async logUpdate(tableName: string, recordId: string, oldData: any, newData: any, context: AuditContext) {
    await this.supabaseAdmin.from('audit_logs').insert({
      table_name: tableName,
      record_id: recordId,
      action: AuditAction.UPDATE,
      old_data: oldData,
      new_data: newData,
      user_id: context.userId,
      user_email: context.email,
      ip_address: context.ip,
      user_agent: context.userAgent,
    });
  }

  async logDelete(tableName: string, recordId: string, oldData: any, context: AuditContext) {
    await this.supabaseAdmin.from('audit_logs').insert({
      table_name: tableName,
      record_id: recordId,
      action: AuditAction.DELETE,
      old_data: oldData,
      user_id: context.userId,
      user_email: context.email,
      ip_address: context.ip,
      user_agent: context.userAgent,
    });
  }

  /**
   * Record an admin-initiated delete. user_id is left null because admins are
   * not rows in `profiles` (the audit_logs.user_id FK target); the acting admin
   * is captured via user_email. Append-only (enforced by DB trigger).
   */
  async logAdminDelete(
    tableName: string,
    recordId: string,
    oldData: unknown,
    admin: { id?: string; username?: string } | undefined,
    req: { ip?: string; headers?: Record<string, unknown> },
  ): Promise<void> {
    const userAgent = req.headers?.['user-agent'];
    const { error } = await this.supabaseAdmin.from('audit_logs').insert({
      table_name: tableName,
      record_id: recordId,
      action: AuditAction.DELETE,
      old_data: oldData ?? null,
      user_id: null,
      user_email: admin?.username ?? 'admin',
      ip_address: req.ip ?? null,
      user_agent: typeof userAgent === 'string' ? userAgent : null,
    });
    if (error) {
      this.logger.warn(`Failed to write delete audit for ${tableName}:${recordId} (code=${error.code ?? 'unknown'})`);
    }
  }

  /**
   * Record an admin-initiated create. Mirrors logAdminDelete: user_id is null
   * (admins aren't profiles rows), the acting admin is captured via user_email.
   */
  async logAdminCreate(
    tableName: string,
    recordId: string,
    newData: unknown,
    admin: { id?: string; username?: string } | undefined,
    req: { ip?: string; headers?: Record<string, unknown> },
  ): Promise<void> {
    const userAgent = req.headers?.['user-agent'];
    const { error } = await this.supabaseAdmin.from('audit_logs').insert({
      table_name: tableName,
      record_id: recordId,
      action: AuditAction.INSERT,
      new_data: newData ?? null,
      user_id: null,
      user_email: admin?.username ?? 'admin',
      ip_address: req.ip ?? null,
      user_agent: typeof userAgent === 'string' ? userAgent : null,
    });
    if (error) {
      this.logger.warn(`Failed to write create audit for ${tableName}:${recordId} (code=${error.code ?? 'unknown'})`);
    }
  }

  /**
   * Record an admin-initiated update (captures both old and new values).
   */
  async logAdminUpdate(
    tableName: string,
    recordId: string,
    oldData: unknown,
    newData: unknown,
    admin: { id?: string; username?: string } | undefined,
    req: { ip?: string; headers?: Record<string, unknown> },
  ): Promise<void> {
    const userAgent = req.headers?.['user-agent'];
    const { error } = await this.supabaseAdmin.from('audit_logs').insert({
      table_name: tableName,
      record_id: recordId,
      action: AuditAction.UPDATE,
      old_data: oldData ?? null,
      new_data: newData ?? null,
      user_id: null,
      user_email: admin?.username ?? 'admin',
      ip_address: req.ip ?? null,
      user_agent: typeof userAgent === 'string' ? userAgent : null,
    });
    if (error) {
      this.logger.warn(`Failed to write update audit for ${tableName}:${recordId} (code=${error.code ?? 'unknown'})`);
    }
  }

  static getAuditContext(req: any): AuditContext {
    return {
      userId: req.user?.id || 'unknown',
      email: req.user?.email || 'unknown',
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
  }
}
