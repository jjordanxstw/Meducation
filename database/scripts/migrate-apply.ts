#!/usr/bin/env ts-node-esm
/**
 * Apply Migrations to Supabase
 *
 * Usage:
 *   npm run db:apply
 *   tsx migrate-apply.ts
 *
 * Required in .env:
 *   SUPABASE_DB_URL - PostgreSQL connection string
 */

import { Client } from 'pg';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '../migrations');

interface Migration {
  version: string;
  name: string;
  path: string;
}

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
      const lines = envContent.split('\n');

      for (const line of lines) {
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

function getMigrations(): Migration[] {
  if (!existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && /^\d+_/.test(f))
    .map((f) => {
      const match = f.match(/^(\d+)_(.+)\.sql$/);
      if (!match) return null;
      return {
        version: match[1],
        name: match[2],
        path: join(MIGRATIONS_DIR, f),
      };
    })
    .filter((m): m is Migration => m !== null)
    .sort((a, b) => parseInt(a.version) - parseInt(b.version));

  return files;
}

function readMigration(path: string): string {
  return readFileSync(path, 'utf-8');
}

async function ensureMigrationsTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id SERIAL PRIMARY KEY,
      version TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_schema_migrations_version
      ON _schema_migrations(version);
  `);
}

async function getAppliedMigrations(client: Client): Promise<Set<string>> {
  try {
    const result = await client.query('SELECT version FROM _schema_migrations ORDER BY applied_at');
    return new Set(result.rows.map((row) => row.version));
  } catch {
    return new Set();
  }
}

async function applyMigration(client: Client, migration: Migration): Promise<void> {
  const sql = readMigration(migration.path);

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      'INSERT INTO _schema_migrations (version, name) VALUES ($1, $2)',
      [migration.version, migration.name]
    );
    await client.query('COMMIT');
    console.log(`  [OK] ${migration.version}_${migration.name}`);
  } catch (error: any) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main(): Promise<void> {
  const { dbUrl, projectId } = loadEnv();
  console.log(`> Connecting to ${projectId}...`);

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('> Connected');

    await ensureMigrationsTable(client);

    const migrations = getMigrations();

    if (migrations.length === 0) {
      console.log('> No migrations found');
      return;
    }

    const applied = await getAppliedMigrations(client);
    const pending = migrations.filter((m) => !applied.has(m.version));

    if (pending.length === 0) {
      console.log('> All migrations applied');
      return;
    }

    console.log(`> Applying ${pending.length} migration(s)...`);

    for (const migration of pending) {
      try {
        await applyMigration(client, migration);
      } catch (error: any) {
        console.error(`  [FAIL] ${migration.version}_${migration.name}`);
        console.error(`  ${error.message}`);

        if (error.message.includes('already exists')) {
          console.log(`  Mark as applied: INSERT INTO _schema_migrations (version, name) VALUES ('${migration.version}', '${migration.name}');`);
        }
        process.exit(1);
      }
    }

    console.log('> Done');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
