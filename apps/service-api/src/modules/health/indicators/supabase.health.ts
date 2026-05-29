import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Health indicator that verifies Supabase/Postgres connectivity with a cheap
 * HEAD query against the migrations table (effectively a `SELECT 1`).
 */
@Injectable()
export class SupabaseHealthIndicator {
  private readonly client: SupabaseClient | null;

  constructor(
    config: ConfigService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.client =
      url && key
        ? createClient(url, key, {
            auth: { autoRefreshToken: false, persistSession: false },
          })
        : null;
  }

  async pingCheck(key = 'database'): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    if (!this.client) {
      return indicator.down({ reason: 'supabase_not_configured' });
    }

    try {
      const { error } = await this.client
        .from('_schema_migrations')
        .select('*', { head: true, count: 'exact' })
        .limit(1);

      if (error) {
        return indicator.down({ message: error.message });
      }

      return indicator.up();
    } catch (err) {
      return indicator.down({
        message: err instanceof Error ? err.message : 'unknown_error',
      });
    }
  }
}
