#!/usr/bin/env ts-node-esm
/**
 * Generate Migration Script
 *
 * Usage:
 *   tsx generate-migration.ts <migration_name>
 *   make db-generate NAME=add_users_table
 */

import { writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '../migrations');

function getNextVersion(): string {
  if (!existsSync(MIGRATIONS_DIR)) {
    mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return '0001';
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && /^\d+_/.test(f))
    .map((f) => parseInt(f.split('_')[0], 10));

  const lastVersion = files.length > 0 ? Math.max(...files) : 0;
  return String(lastVersion + 1).padStart(4, '0');
}

function generateTemplate(name: string, version: string): string {
  const timestamp = new Date().toISOString();
  return `-- Migration: ${name}
-- Version: ${version}
-- Created: ${timestamp}

-- Add your migration SQL below

`;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: tsx generate-migration.ts <migration_name>');
    console.error('Example: tsx generate-migration.ts add_users_table');
    process.exit(1);
  }

  const migrationName = args[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');

  if (!migrationName) {
    console.error('Error: Invalid migration name');
    process.exit(1);
  }

  const version = getNextVersion();
  const filename = `${version}_${migrationName}.sql`;
  const filepath = join(MIGRATIONS_DIR, filename);

  if (existsSync(filepath)) {
    console.error(`Error: ${filename} already exists`);
    process.exit(1);
  }

  if (!existsSync(MIGRATIONS_DIR)) {
    mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  writeFileSync(filepath, generateTemplate(migrationName, version), 'utf-8');
  console.log(`Created: migrations/${filename}`);
}

main();
