/**
 * One service-role Supabase client for the whole API.
 *
 * Every service used to build its own client (21 copies of the same config and
 * HTTP agent). The client is now created once per ConfigService instance: the
 * app has exactly one, so it shares one client, while unit tests that build a
 * fresh config get a fresh (mocked) client each time.
 */
import type { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@medical-portal/shared';

const clients = new WeakMap<ConfigService, SupabaseClient<Database>>();

function build(config: ConfigService): SupabaseClient<Database> | null {
  const url = config.get<string>('SUPABASE_URL');
  const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** The shared service-role client; throws when the Supabase env vars are missing. */
export function getSupabaseAdmin(config: ConfigService): SupabaseClient<Database> {
  const existing = clients.get(config);
  if (existing) return existing;
  const client = build(config);
  if (!client) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
  clients.set(config, client);
  return client;
}

/** Same client, or null when Supabase isn't configured (health checks, idempotency). */
export function tryGetSupabaseAdmin(config: ConfigService): SupabaseClient<Database> | null {
  try {
    return getSupabaseAdmin(config);
  } catch {
    return null;
  }
}
