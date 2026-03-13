#!/usr/bin/env ts-node-esm
/**
 * Database Reset Script - Drops all tables
 *
 * Usage:
 *   npm run db:reset
 *   make db-reset
 */

import { Client } from 'pg';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(): { dbUrl: string; projectId: string } {
  const envPaths = [
    join(process.cwd(), '.env'),
    join(process.cwd(), '../../.env'),
    join(__dirname, '../../.env'),
  ];

  let dbUrl = process.env.SUPABASE_DB_URL || '';
  let supabaseUrl = process.env.SUPABASE_URL || '';

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      for (const line of envContent.split('\n')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (key === 'SUPABASE_DB_URL') dbUrl = value;
        if (key === 'SUPABASE_URL') supabaseUrl = value;
      }
      if (dbUrl) break;
    }
  }

  const projectIdMatch = supabaseUrl.match(/\/\/([^.]+)\.supabase\.co/);
  const projectId = projectIdMatch ? projectIdMatch[1] : 'unknown';

  if (!dbUrl) {
    console.error('Error: SUPABASE_DB_URL not found in .env file');
    throw new Error('SUPABASE_DB_URL is required');
  }

  return { dbUrl, projectId };
}

async function confirm(): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Type "yes" to confirm: ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function getTables(client: Client): Promise<string[]> {
  const result = await client.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);
  return result.rows.map((row: any) => row.tablename);
}

async function main(): Promise<void> {
  console.log('WARNING: This will DELETE ALL DATA!');
  const { dbUrl, projectId } = loadEnv();
  console.log(`Target: ${projectId}`);

  const confirmed = process.argv.includes('--confirm') || await confirm();
  if (!confirmed) {
    console.log('Cancelled');
    process.exit(0);
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    const tables = await getTables(client);

    if (tables.length === 0) {
      console.log('No tables to drop');
      return;
    }

    console.log(`Dropping ${tables.length} table(s) (including migration tracking)...`);

    await client.query('BEGIN');
    for (const table of tables) {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      console.log(`  [OK] ${table}`);
    }
    await client.query('COMMIT');

    console.log('Done. Run: make db-migrate');
  } catch (error: any) {
    await client.query('ROLLBACK');
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
