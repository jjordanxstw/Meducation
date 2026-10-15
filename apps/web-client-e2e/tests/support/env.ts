/**
 * Integration-test harness for the LOCAL Supabase stack (pnpm db:local:*).
 *
 * Every secret here is a local/CI-only value: tokens are minted with the same
 * JWT_SECRET / NEXTAUTH_SECRET the locally started API and web client use, so
 * no Google sign-in is needed and nothing ever touches the shared database.
 */
import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { APIRequestContext, BrowserContext } from '@playwright/test';

const repoRoot = path.resolve(__dirname, '../../../..');
const requireFromRoot = createRequire(path.join(repoRoot, 'package.json'));
const requireFromWeb = createRequire(path.join(repoRoot, 'apps/web-client/package.json'));

export const E2E = {
  webUrl: process.env.E2E_BASE_URL ?? 'http://localhost:3001',
  adminUrl: process.env.E2E_ADMIN_URL ?? 'http://localhost:3002',
  apiUrl: process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1',
  dbUrl: process.env.E2E_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  jwtSecret: process.env.E2E_JWT_SECRET ?? 'local-only-jwt-secret-change-me-at-least-32-chars',
  nextAuthSecret: process.env.E2E_NEXTAUTH_SECRET ?? 'local-only-nextauth-secret',
  admin: { username: 'admin', password: 'MedPi-local-1234!' },
};

/** Seeded mock students (database/scripts/seed-mock.ts). */
export const STUDENT_A = 'mock-google-sub-001';
export const STUDENT_B = 'mock-google-sub-002';

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

/** HS256 student session token, as issued by the API after Google sign-in. */
export function studentToken(sub = STUDENT_A, secret = E2E.jwtSecret): string {
  const now = Math.floor(Date.now() / 1000);
  const head = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    sub,
    email: `${sub}@student.mahidol.edu`,
    name: 'E2E Student',
    iat: now,
    exp: now + 3600,
  })}`;
  return `${head}.${createHmac('sha256', secret).update(head).digest('base64url')}`;
}

/** Signs a browser context in as a student: NextAuth session + API access cookie. */
export async function signInStudent(context: BrowserContext, sub = STUDENT_A) {
  const { encode } = requireFromWeb('next-auth/jwt') as typeof import('next-auth/jwt');
  const session = await encode({
    token: { sub, name: 'E2E Student', email: `${sub}@student.mahidol.edu`, idToken: 'e2e' },
    secret: E2E.nextAuthSecret,
  });
  const domain = new URL(E2E.webUrl).hostname;
  await context.addCookies([
    { name: 'next-auth.session-token', value: session, domain, path: '/', httpOnly: true, sameSite: 'Lax' },
    { name: 'student_access_token', value: studentToken(sub), domain, path: '/', httpOnly: true, sameSite: 'Lax' },
  ]);
}

/** Logs the request context in as the local admin; returns headers for writes. */
export async function loginAdmin(request: APIRequestContext): Promise<Record<string, string>> {
  const response = await request.post(`${E2E.apiUrl}/admin/auth/login`, { data: E2E.admin });
  if (!response.ok()) throw new Error(`admin login failed: ${response.status()} ${await response.text()}`);
  const { cookies } = await request.storageState();
  const csrf = cookies.find((cookie) => cookie.name === '_csrf')?.value;
  return csrf ? { 'x-csrf-token': csrf } : {};
}

type Row = Record<string, string>;

/** Runs one query against the local database (fixtures for hidden content, etc.). */
export async function db<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const { Client } = requireFromRoot('pg') as typeof import('pg');
  const client = new Client({ connectionString: E2E.dbUrl });
  await client.connect();
  try {
    return (await client.query(sql, params)).rows as T[];
  } finally {
    await client.end();
  }
}

export async function one<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T> {
  const [row] = await db<T>(sql, params);
  if (!row) throw new Error(`fixture not found: ${sql}`);
  return row;
}
