import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ServiceApiService implements OnModuleInit {
  private readonly logger = new Logger(ServiceApiService.name);
  private readonly supabaseAdmin: SupabaseClient | null;
  private readonly cleanupEnabled: boolean;
  // Min gap before a /health hit may trigger cleanup again (the in-process @Cron
  // is the primary trigger; this is a belt-and-suspenders for hosts where the
  // process restarts often, e.g. Render free, but a pinger keeps it awake).
  private readonly healthDebounceMs: number;
  private lastCleanupAt = 0;
  private cleanupInFlight = false;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    // Back-compat with the previous env name (HEALTH_SECURITY_CLEANUP_ENABLED).
    this.cleanupEnabled =
      this.configService.get<string>('SECURITY_CLEANUP_ENABLED') !== 'false' &&
      this.configService.get<string>('HEALTH_SECURITY_CLEANUP_ENABLED') !== 'false';
    this.healthDebounceMs = Number(
      this.configService.get<string>('SECURITY_CLEANUP_INTERVAL_MS') ??
        this.configService.get<string>('HEALTH_SECURITY_CLEANUP_INTERVAL_MS') ??
        12 * 60 * 60 * 1000,
    );

    if (supabaseUrl && supabaseServiceKey) {
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    } else {
      this.supabaseAdmin = null;
    }
  }

  getHealthStatus(): { status: string; timestamp: string } {
    // Opportunistic cleanup on health pings (debounced) — works well when an
    // uptime pinger hits /health regularly. Fire-and-forget; never blocks health.
    if (Date.now() - this.lastCleanupAt >= this.healthDebounceMs) {
      void this.runCleanup('health');
    }
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  // Prune once shortly after boot so a freshly deployed/restarted instance doesn't
  // wait for the next trigger.
  onModuleInit(): void {
    void this.runCleanup('startup');
  }

  // Daily scheduled cleanup (primary trigger for long-running hosts).
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'security-cleanup' })
  async scheduledCleanup(): Promise<void> {
    await this.runCleanup('cron');
  }

  private async runCleanup(trigger: 'startup' | 'cron' | 'health'): Promise<void> {
    if (!this.cleanupEnabled || !this.supabaseAdmin || this.cleanupInFlight) {
      return;
    }
    this.cleanupInFlight = true;
    this.lastCleanupAt = Date.now();
    try {
      const { data, error } = await this.supabaseAdmin.rpc('cleanup_all_expired');
      if (error) {
        this.logger.warn(`cleanup_all_expired (${trigger}) failed (code=${error.code ?? 'unknown'})`);
      } else {
        this.logger.log(`cleanup_all_expired (${trigger}) executed: ${JSON.stringify(data)}`);
      }
    } catch (error: unknown) {
      this.logger.warn(
        `cleanup_all_expired (${trigger}) failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    } finally {
      this.cleanupInFlight = false;
    }
  }
}
