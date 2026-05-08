import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ServiceApiService {
  private readonly logger = new Logger(ServiceApiService.name);
  private readonly supabaseAdmin: SupabaseClient | null;
  private readonly cleanupEnabled: boolean;
  private readonly cleanupIntervalMs: number;
  private lastCleanupAt = 0;
  private cleanupInFlight = false;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.cleanupEnabled = this.configService.get<string>('HEALTH_SECURITY_CLEANUP_ENABLED') !== 'false';
    this.cleanupIntervalMs = Number(this.configService.get<string>('HEALTH_SECURITY_CLEANUP_INTERVAL_MS') ?? 24 * 60 * 60 * 1000);

    if (supabaseUrl && supabaseServiceKey) {
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } else {
      this.supabaseAdmin = null;
    }
  }

  getHealthStatus(): { status: string; timestamp: string } {
    this.maybeRunSecurityCleanup();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  private maybeRunSecurityCleanup(): void {
    if (!this.cleanupEnabled || !this.supabaseAdmin || this.cleanupInFlight) {
      return;
    }
    const supabaseAdmin = this.supabaseAdmin;

    const now = Date.now();
    if (now - this.lastCleanupAt < this.cleanupIntervalMs) {
      return;
    }

    this.cleanupInFlight = true;
    this.lastCleanupAt = now;

    void (async () => {
      try {
        const { error } = await supabaseAdmin.rpc('cleanup_security_artifacts');
        if (error) {
          this.logger.warn(`cleanup_security_artifacts failed (code=${error.code ?? 'unknown'})`);
        } else {
          this.logger.log('cleanup_security_artifacts executed');
        }
      } catch (error: unknown) {
        this.logger.warn(`cleanup_security_artifacts failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      } finally {
        this.cleanupInFlight = false;
      }
    })();
  }
}
