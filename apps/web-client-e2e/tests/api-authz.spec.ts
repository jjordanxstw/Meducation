import { test, expect, request as playwrightRequest } from '@playwright/test';
import { E2E, STUDENT_A, STUDENT_B, db, loginAdmin, one, studentToken } from './support/env';

/**
 * API authorization rules, checked against the real API + local database.
 * Covers the 2026-10 review findings (S1 hidden content, S4 session IDOR) and
 * the basic auth boundaries around them.
 */

const asStudent = (sub = STUDENT_A) => ({ Cookie: `student_access_token=${studentToken(sub)}` });

test.describe('student read path', () => {
  test('rejects requests without a session', async ({ request }) => {
    const response = await request.get(`${E2E.apiUrl}/subjects`);
    expect(response.status()).toBe(401);
  });

  test('rejects a token signed with the wrong secret', async ({ request }) => {
    const forged = studentToken(STUDENT_A, 'not-the-real-secret-not-the-real-secret');
    const response = await request.get(`${E2E.apiUrl}/subjects`, { headers: { Cookie: `student_access_token=${forged}` } });
    expect(response.status()).toBe(401);
  });

  test('never lists an inactive subject, even with ?is_active=false', async ({ request }) => {
    const hidden = await one(`SELECT id FROM subjects WHERE NOT is_active LIMIT 1`);
    const response = await request.get(`${E2E.apiUrl}/subjects?is_active=false`, { headers: asStudent() });
    expect(response.status()).toBe(200);
    const ids = (await response.json()).data.map((subject: { id: string }) => subject.id);
    expect(ids).not.toContain(hidden.id);
  });

  test('returns 404 for an inactive subject by id', async ({ request }) => {
    const hidden = await one(`SELECT id FROM subjects WHERE NOT is_active LIMIT 1`);
    const response = await request.get(`${E2E.apiUrl}/subjects/${hidden.id}`, { headers: asStudent() });
    expect(response.status()).toBe(404);
  });

  test('returns 404 for a lecture whose section is inactive', async ({ request }) => {
    const lecture = await one(
      `SELECT l.id FROM lectures l JOIN sections s ON s.id = l.section_id WHERE NOT s.is_active AND l.is_active LIMIT 1`,
    );
    const response = await request.get(`${E2E.apiUrl}/lectures/${lecture.id}`, { headers: asStudent() });
    expect(response.status()).toBe(404);
  });

  test('omits inactive files from an active lecture', async ({ request }) => {
    const lecture = await one(
      `SELECT l.id FROM lectures l JOIN resources r ON r.lecture_id = l.id JOIN sections s ON s.id = l.section_id
       JOIN subjects sub ON sub.id = s.subject_id
       WHERE NOT r.is_active AND l.is_active AND s.is_active AND sub.is_active LIMIT 1`,
    );
    const response = await request.get(`${E2E.apiUrl}/lectures/${lecture.id}`, { headers: asStudent() });
    expect(response.status()).toBe(200);
    const { resources } = (await response.json()).data;
    expect(resources.length).toBeGreaterThan(0);
    expect(resources.every((resource: { is_active: boolean }) => resource.is_active)).toBe(true);
  });
});

test.describe('sessions and boundaries', () => {
  test('a student cannot revoke another student’s session', async ({ request }) => {
    const [victim] = await db<{ id: string }>(
      `INSERT INTO refresh_tokens (user_id, user_type, token_hash, expires_at)
       VALUES ($1, 'student', 'e2e-' || gen_random_uuid(), now() + interval '1 day') RETURNING id`,
      [STUDENT_B],
    );
    const response = await request.post(`${E2E.apiUrl}/auth/sessions/${victim.id}/revoke`, {
      // Double-submit CSRF: any matching cookie/header pair passes; ownership must still fail.
      headers: { Cookie: `student_access_token=${studentToken(STUDENT_A)}; _csrf=e2e`, 'x-csrf-token': 'e2e' },
    });
    expect(response.status()).toBe(404);
    const [row] = await db<{ revoked: string }>(`SELECT (revoked_at IS NOT NULL)::text AS revoked FROM refresh_tokens WHERE id = $1`, [victim.id]);
    expect(row.revoked).toBe('false');
  });

  test('state-changing requests need the CSRF token', async ({ request }) => {
    const response = await request.post(`${E2E.apiUrl}/auth/sessions/revoke-all`, { headers: asStudent() });
    expect(response.status()).toBe(403);
  });

  test('a student session cannot call admin endpoints', async ({ request }) => {
    const response = await request.get(`${E2E.apiUrl}/admin/subjects`, { headers: asStudent() });
    expect([401, 403]).toContain(response.status());
  });

  test('admin endpoints reject anonymous requests', async ({ request }) => {
    const response = await request.get(`${E2E.apiUrl}/admin/statistics/attention`);
    expect(response.status()).toBe(401);
  });
});

test.describe('admin editing', () => {
  test('a stale subject-tree save is refused with 409', async () => {
    const admin = await playwrightRequest.newContext();
    const headers = await loginAdmin(admin);
    const subject = await one(`SELECT id FROM subjects WHERE is_active ORDER BY order_index LIMIT 1`);
    const tree = (await (await admin.get(`${E2E.apiUrl}/admin/subjects/${subject.id}/tree`)).json()).data;
    expect(tree.tree_version).toEqual(expect.any(String));

    const response = await admin.put(`${E2E.apiUrl}/admin/subjects/${subject.id}/tree`, {
      headers,
      data: {
        subject_id: subject.id,
        expected_version: 'stale',
        subject: { code: tree.code, name: tree.name, year_level: tree.year_level, order_index: tree.order_index, is_active: tree.is_active },
        sections: [],
      },
    });
    expect(response.status()).toBe(409);
    // The refused save must not have touched the tree.
    const after = (await (await admin.get(`${E2E.apiUrl}/admin/subjects/${subject.id}/tree`)).json()).data;
    expect(after.tree_version).toBe(tree.tree_version);
    await admin.dispose();
  });

  test('a fresh subject-tree save in the editor’s shape succeeds and bumps the version', async () => {
    const admin = await playwrightRequest.newContext();
    const headers = await loginAdmin(admin);
    const subject = await one(`SELECT id FROM subjects WHERE code = 'MDPS103'`);
    const tree = (await (await admin.get(`${E2E.apiUrl}/admin/subjects/${subject.id}/tree`)).json()).data;
    const runId = String(Date.now()).slice(-11);

    // Mirrors SubjectTreeForm's submit payload, plus one new lecture (no id yet).
    const sections = tree.sections.map((s: any, index: number) => ({
      id: s.id,
      name: s.name,
      description: s.description || null,
      is_active: s.is_active,
      lectures: [
        ...s.lectures.map((l: any) => ({
          id: l.id,
          title: l.title,
          description: l.description || null,
          lecture_date: l.lecture_date || null,
          lecturer_name: l.lecturer_name || null,
          is_active: l.is_active,
          resources: l.resources.map((r: any) => ({ id: r.id, label: r.label, url: r.url, type: r.type, is_active: r.is_active })),
        })),
        ...(index === 0
          ? // Unique per run: titles are unique per section, and a reused video would be flagged as a duplicate.
            [{ title: `E2E imported lecture ${runId}`, description: null, lecture_date: null, lecturer_name: null, is_active: true,
               resources: [{ label: 'Lecture recording', url: `https://www.youtube.com/watch?v=${runId}`, type: 'youtube', is_active: true }] }]
          : []),
      ],
    }));
    const response = await admin.put(`${E2E.apiUrl}/admin/subjects/${subject.id}/tree`, {
      headers,
      data: {
        subject_id: subject.id,
        expected_version: tree.tree_version,
        subject: { code: tree.code, name: tree.name, year_level: tree.year_level, description: tree.description || null, thumbnail_url: tree.thumbnail_url || null, order_index: tree.order_index, is_active: tree.is_active },
        sections,
      },
    });
    expect(response.status(), await response.text()).toBe(200);

    const after = (await (await admin.get(`${E2E.apiUrl}/admin/subjects/${subject.id}/tree`)).json()).data;
    expect(after.tree_version).not.toBe(tree.tree_version);
    expect(after.sections[0].lectures.some((l: { title: string }) => l.title === `E2E imported lecture ${runId}`)).toBe(true);
    await admin.dispose();
  });
});
