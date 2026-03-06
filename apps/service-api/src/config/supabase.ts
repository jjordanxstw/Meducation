/**
 * Supabase Client Configuration
 */

import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

// Client for public/authenticated operations
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = typeof supabaseAdmin;
