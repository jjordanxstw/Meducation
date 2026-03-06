/**
 * Environment Configuration
 */

import dotenv from 'dotenv';

dotenv.config();

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

export const config = {
  // Environment
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  isDev: process.env.NODE_ENV !== 'production',
  
  // Server
  port: parseInt(getEnvVar('PORT', '3001'), 10),
  
  // Supabase
  supabaseUrl: getEnvVar('SUPABASE_URL', 'https://example.supabase.co'),
  supabaseAnonKey: getEnvVar('SUPABASE_ANON_KEY', 'example-key'),
  supabaseServiceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', 'example-service-key'),
  
  // Google OAuth
  googleClientId: getEnvVar('GOOGLE_CLIENT_ID', 'example.apps.googleusercontent.com'),
  // JWT for server-side session cookie
  jwtSecret: getEnvVar('JWT_SECRET', 'dev-secret'),
  sessionCookieName: getEnvVar('SESSION_COOKIE_NAME', 'session'),
  sessionCookieMaxAgeMs: parseInt(getEnvVar('SESSION_COOKIE_MAX_AGE_MS', String(60 * 60 * 1000)), 10), // 1 hour
  
  // CORS
  corsOrigins: getEnvVar('CORS_ORIGINS', 'http://localhost:5173,http://localhost:5174').split(','),
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000'), 10), // 15 minutes
  rateLimitMaxRequests: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  
  // Mahidol Email Domain
  allowedEmailDomain: ['@student.mahidol.edu','@student.mahidol.ac.th'],
} as const;

export type Config = typeof config;
