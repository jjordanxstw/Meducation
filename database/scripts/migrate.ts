#!/usr/bin/env ts-node-esm
/**
 * Database Migration Status Checker
 *
 * Usage:
 *   npm run db:status        # Show migration status
 *   tsx migrate.ts status
 */

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

function loadEnv(): { projectId: string } {
  const envPaths = [
    join(process.cwd(), '.env'),
    join(process.cwd(), '../../.env'),
    join(__dirname, '../../.env'),
  ];

  let supabaseUrl = process.env.SUPABASE_URL || '';

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      for (const line of envContent.split('\n')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (key === 'SUPABASE_URL') supabaseUrl = value;
      }
      if (supabaseUrl) break;
    }
  }

  const projectIdMatch = supabaseUrl.match(/\/\/([^.]+)\.supabase\.co/);
  const projectId = projectIdMatch ? projectIdMatch[1] : 'unknown';

  return { projectId };
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

function showStatus(): void {
  const { projectId } = loadEnv();
  const migrations = getMigrations();

  console.log(`> Project: ${projectId}`);
  console.log(`> Migrations: ${migrations.length}`);

  for (const migration of migrations) {
    console.log(`  ${migration.version}_${migration.name}`);
  }
}

function main(): void {
  const command = process.argv[2] || 'status';

  try {
    if (command === 'status') {
      showStatus();
    } else {
      console.log('Usage: tsx migrate.ts status');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
