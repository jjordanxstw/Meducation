#!/usr/bin/env ts-node-esm
/**
 * Create Admin User Script - Interactive
 *
 * Usage:
 *   make create-admin           # Interactive mode
 *   tsx create-admin.ts         # Interactive mode
 */

import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

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
    const envPath = join(process.cwd(), '.env');
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

  console.log('\n> Admin created successfully');
  console.log(`  Username: ${newAdmin.username}`);
  console.log(`  Name: ${newAdmin.full_name}`);
  if (newAdmin.email) console.log(`  Email: ${newAdmin.email}`);
}

function askQuestion(rl: any, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer: string) => {
      resolve(answer);
    });
  });
}

async function main() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log('> Create Admin User\n');

    // Username
    let username: string;
    while (true) {
      username = await askQuestion(rl, '1) Username: ');
      if (validateUsername(username)) {
        break;
      }
      console.error('   Invalid: 3-50 chars, alphanumeric and underscore only');
    }

    // Password
    let password: string;
    while (true) {
      password = await askQuestion(rl, '2) Password: ');
      const validation = validatePassword(password);
      if (validation.valid) {
        break;
      }
      console.error('   Invalid password:');
      validation.errors.forEach(err => console.error(`     - ${err}`));
    }

    // Confirm password
    while (true) {
      const confirmPassword = await askQuestion(rl, '3) Confirm password: ');
      if (confirmPassword === password) {
        break;
      }
      console.error('   Passwords do not match');
    }

    // Full name
    const fullName = await askQuestion(rl, '4) Full name: ') || username;

    // Email (optional)
    const email = await askQuestion(rl, '5) Email (optional): ') || undefined;

    rl.close();

    await createAdmin({
      username,
      password,
      full_name: fullName,
      email,
    });
  } catch (error: any) {
    rl.close();
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
