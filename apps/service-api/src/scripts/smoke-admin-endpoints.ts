/*
 * Lightweight smoke tests for admin statistics and search endpoints.
 *
 * Usage:
 *   API_BASE_URL=http://localhost:3000/api/v1 ADMIN_BEARER_TOKEN=<token> pnpm --filter service-api test:smoke:admin
 */

type Envelope<T> = {
  success: boolean;
  data: T;
};

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson<T>(path: string): Promise<Envelope<T>> {
  const baseUrl = process.env.API_BASE_URL;
  const token = process.env.ADMIN_BEARER_TOKEN;

  if (!baseUrl) {
    throw new Error('Missing API_BASE_URL');
  }

  if (!token) {
    throw new Error('Missing ADMIN_BEARER_TOKEN');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert(response.ok, `Request failed for ${path} with status ${response.status}`);
  const json = (await response.json()) as Envelope<T>;
  assert(json.success === true, `Request ${path} returned success=false`);
  return json;
}

async function run(): Promise<void> {
  const stats = await requestJson<{
    kpis: Record<string, { total: number; active: number }>;
    studentsByYear: Array<{ yearLevel: number; count: number }>;
    upcomingEvents: unknown[];
    recentAuditLogs: unknown[];
  }>('/admin/statistics/overview');

  assert(typeof stats.data.kpis === 'object' && stats.data.kpis !== null, 'Missing kpis in statistics response');
  assert(Array.isArray(stats.data.studentsByYear), 'studentsByYear is not an array');
  assert(Array.isArray(stats.data.upcomingEvents), 'upcomingEvents is not an array');
  assert(Array.isArray(stats.data.recentAuditLogs), 'recentAuditLogs is not an array');

  const listPaths = [
    '/admin/subjects?search=test&page=1&pageSize=5',
    '/admin/sections?search=test&page=1&pageSize=5',
    '/admin/lectures?search=test&page=1&pageSize=5',
    '/admin/resources?search=test&page=1&pageSize=5',
    '/admin/calendar?search=test',
    '/admin/profiles?search=test&page=1&pageSize=5',
    '/admin/audit-logs?search=test&page=1&pageSize=5',
  ];

  for (const path of listPaths) {
    const result = await requestJson<unknown>(path);
    assert(result.data !== undefined, `Missing data for ${path}`);
  }

  process.stdout.write('Admin endpoint smoke tests passed\n');
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Smoke test failed: ${message}\n`);
  process.exit(1);
});
