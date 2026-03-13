#!/usr/bin/env ts-node-esm
/**
 * Create Admin User Script
 *
 * Usage:
 *   tsx create-admin.ts <username> <password> [full-name] [email]
 *   make create-admin USERNAME=admin PASSWORD=pass
 */

import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface AdminInput {
  username: string;
  password: string;
  full_name: string;
  email?: string;
}

function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,50}$/.test(username);
}

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Min 8 characters');
  if (password.length > 128) errors.push('Max 128 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must contain uppercase');
  if (!/[a-z]/.test(password)) errors.push('Must contain lowercase');
  if (!/[0-9]/.test(password)) errors.push('Must contain number');
  return { valid: errors.length === 0, errors };
}

function loadEnvFile(): { supabaseUrl: string; supabaseKey: string } {
  let supabaseUrl = process.env.SUPABASE_URL || '';
  let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    const envPath = join(__dirname, '..', '..', '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const urlMatch = envContent.match(/SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (urlMatch) supabaseUrl = urlMatch[1].trim();
    if (keyMatch) supabaseKey = keyMatch[1].trim();
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  }

  return { supabaseUrl, supabaseKey };
}

async function createAdmin(input: AdminInput): Promise<void> {
  const { username, password, full_name, email } = input;

  if (!validateUsername(username)) {
    console.error('Invalid username: 3-50 chars, alphanumeric and underscore only');
    process.exit(1);
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    console.error('Invalid password:');
    passwordValidation.errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  const { supabaseUrl, supabaseKey } = loadEnvFile();
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check if username exists
  const { data: existingAdmin } = await supabase
    .from('admins')
    .select('id')
    .eq('username', username)
    .single();

  if (existingAdmin) {
    console.error(`Username "${username}" already exists`);
    process.exit(1);
  }

  // Hash password
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Insert admin
  const { data: newAdmin, error: insertError } = await supabase
    .from('admins')
    .insert({
      username,
      password_hash,
      full_name,
      email: email || null,
    })
    .select('id, username, full_name, email')
    .single();

  if (insertError) {
    console.error('Failed to create admin:', insertError.message);
    process.exit(1);
  }

  console.log('Admin created successfully');
  console.log(`  Username: ${newAdmin.username}`);
  console.log(`  Name: ${newAdmin.full_name}`);
  if (newAdmin.email) console.log(`  Email: ${newAdmin.email}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: tsx create-admin.ts <username> <password> [full-name] [email]');
    console.log('Example: tsx create-admin.ts admin SecurePass123 "Admin User" admin@test.com');
    process.exit(0);
  }

  const [username, password, full_name, email] = args;

  await createAdmin({
    username,
    password,
    full_name: full_name || username,
    email,
  });
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
