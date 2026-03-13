#!/usr/bin/env ts-node-esm
/**
 * Seed Database Script
 *
 * Usage:
 *   npm run db:seed
 *   make db-seed
 */

import { Client } from 'pg';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(): { dbUrl: string } {
  const envPaths = [
    join(process.cwd(), '.env'),
    join(process.cwd(), '../../.env'),
    join(__dirname, '../../.env'),
  ];

  let dbUrl = process.env.SUPABASE_DB_URL || '';

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      for (const line of envContent.split('\n')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (key === 'SUPABASE_DB_URL') dbUrl = value;
      }
      if (dbUrl) break;
    }
  }

  if (!dbUrl) {
    console.error('Error: SUPABASE_DB_URL not found in .env file');
    throw new Error('SUPABASE_DB_URL is required');
  }

  return { dbUrl };
}

async function main(): Promise<void> {
  const { dbUrl } = loadEnv();
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('> Seeding database...');

    // Sample subjects
    await client.query(`
      INSERT INTO subjects (id, name, code, year_level, description, order_index) VALUES
      ('11111111-1111-1111-1111-111111111111', 'Anatomy I', 'SCID101', 1, 'Basic anatomy for medical students', 1),
      ('22222222-2222-2222-2222-222222222222', 'Physiology I', 'SCID102', 1, 'Basic physiology', 2)
      ON CONFLICT (code) DO NOTHING;
    `);

    console.log('> Done');
  } catch (error: any) {
    console.error('Failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
