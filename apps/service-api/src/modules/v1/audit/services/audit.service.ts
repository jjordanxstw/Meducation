/**
 * Audit Service
 * Handles audit logging
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuditAction } from '@medical-portal/shared';
import { ErrorCode } from '@medical-portal/shared';
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
    } = params;

    let query = this.supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' });

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
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`table_name.ilike.${term},action.ilike.${term},record_id.ilike.${term},user_email.ilike.${term},ip_address.ilike.${term}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      this.logger.warn(`Failed to fetch audit logs (code=${error.code ?? 'unknown'})`);
      throw new AppException(ErrorCode.RESOURCE_OPERATION_FAILED, { resource: 'audit_log' }, 'Failed to fetch audit logs');
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

  static getAuditContext(req: any): AuditContext {
    return {
      userId: req.user?.id || 'unknown',
      email: req.user?.email || 'unknown',
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
  }
}
