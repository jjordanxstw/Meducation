import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { SkipEnvelope } from '../../common/decorators/skip-envelope.decorator';
import { SupabaseHealthIndicator } from './indicators/supabase.health';

/**
 * Health endpoints consumed by Render's health checks and container orchestrators.
 * Mounted outside the global `api` prefix and version-neutral so probes can hit
 * stable paths (`/health`, `/health/ready`, `/health/live`).
 *
 * These routes are not behind any auth guard and are excluded from rate limiting.
 */
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  // ~150MB heap ceiling — generous for this API; trips before the container OOMs.
  private static readonly MEMORY_HEAP_LIMIT = 150 * 1024 * 1024;

  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly supabase: SupabaseHealthIndicator,
  ) {}

  @Get()
  @SkipEnvelope()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.supabase.pingCheck('database'),
      () =>
        this.memory.checkHeap('memory_heap', HealthController.MEMORY_HEAP_LIMIT),
    ]);
  }

  @Get('ready')
  @SkipEnvelope()
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.supabase.pingCheck('database'),
      () =>
        this.memory.checkHeap('memory_heap', HealthController.MEMORY_HEAP_LIMIT),
    ]);
  }

  @Get('live')
  @SkipEnvelope()
  @HealthCheck()
  liveness(): Promise<HealthCheckResult> {
    // Liveness must stay cheap and dependency-free: always 200 if the process
    // is running and able to respond.
    return this.health.check([]);
  }
}
