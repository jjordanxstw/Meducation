import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { E2E, loginAdmin, one } from './support/env';

/**
 * Every admin write endpoint validates its body with a shared Zod schema. These
 * tests send the exact payload shapes the admin forms produce (including the
 * '' / null values of cleared fields) so a schema can never silently break a
 * form, and check that malformed bodies are rejected with 400.
 */

let admin: APIRequestContext;
let headers: Record<string, string>;

test.beforeAll(async () => {
  admin = await playwrightRequest.newContext();
  headers = await loginAdmin(admin);
});

test.afterAll(async () => {
  await admin.dispose();
});

/** Create → update → delete with form-shaped payloads; returns nothing, asserts each step. */
async function roundTrip(resource: string, create: object, update: object) {
  const created = await admin.post(`${E2E.apiUrl}/admin/${resource}`, { headers, data: create });
  expect(created.status(), `${resource} create: ${await created.text()}`).toBeLessThan(300);
  const id = (await created.json()).data?.id;
  expect(id, `${resource} create returned an id`).toBeTruthy();

  const updated = await admin.put(`${E2E.apiUrl}/admin/${resource}/${id}`, { headers, data: update });
  expect(updated.status(), `${resource} update: ${await updated.text()}`).toBeLessThan(300);

  const removed = await admin.delete(`${E2E.apiUrl}/admin/${resource}/${id}`, { headers });
  expect(removed.status(), `${resource} delete`).toBeLessThan(300);
}

test('announcements accept the form payload', async () => {
  await roundTrip(
    'announcements',
    { title: 'E2E notice', content: 'Body', is_pinned: false, is_published: false },
    { title: 'E2E notice (edited)', content: 'Body', is_pinned: true, is_published: false },
  );
});

test('calendar events accept the form payload, including cleared fields', async () => {
  await roundTrip(
    'calendar',
    {
      title: 'E2E event', type: 'event', start_date: '2026-11-02', end_date: null, start_time: null,
      end_time: null, daily_schedule: false, subject_id: null, location: '', description: '',
    },
    {
      title: 'E2E event', type: 'exam', start_date: '2026-11-02', end_date: '2026-11-03', start_time: '09:00',
      end_time: '12:00', daily_schedule: true, subject_id: null, location: 'Hall 1', description: 'Edited',
    },
  );
});

test('event types and news categories accept the form payload', async () => {
  await roundTrip('event-types', { name: 'e2e-type', color: '#123456' }, { name: 'e2e-type-2', color: '#654321' });
  await roundTrip('news-categories', { name: 'E2E category', color: '#2f80ed' }, { name: 'E2E category 2', color: '#10b981' });
});

test('news accepts the form payload with a cleared category and cover', async () => {
  await roundTrip(
    'news',
    { title: 'E2E story', summary: '', body: 'Body', cover_image_url: '', author_name: '', category_id: null, is_featured: false, is_published: false },
    { title: 'E2E story', summary: 'Summary', body: 'Body 2', cover_image_url: '', author_name: 'Team', category_id: null, is_featured: false, is_published: false, published_at: '2026-10-15T09:00:00.000Z' },
  );
});

test('team members accept the form payload with blank links', async () => {
  await roundTrip(
    'team-members',
    { full_name: 'E2E Person', role: 'Tester', bio: '', avatar_url: '', email: '', linkedin_url: '', github_url: '', instagram_url: '', order_index: 9, is_active: false },
    { full_name: 'E2E Person', role: 'Tester', bio: 'Bio', avatar_url: '', email: 'e2e@example.com', linkedin_url: 'https://linkedin.com/in/e2e', github_url: '', instagram_url: '', order_index: 9, is_active: false },
  );
});

test('Learning Hub cards accept the form payload', async () => {
  await roundTrip(
    'learning-resources',
    { title: 'E2E card', description: '', image_url: '', author_name: '', technologies: ['Testing'], categories: [{ name: 'Links', links: [{ label: 'Docs', url: 'https://example.com' }] }], is_published: false },
    { title: 'E2E card 2', description: 'Desc', image_url: '', author_name: 'Team', technologies: [], categories: [], is_published: false },
  );
});

test('subject edit and profile edit accept the form payload', async () => {
  const subject = await one(`SELECT id, code, name, year_level, order_index FROM subjects WHERE code = 'MDFM504'`);
  const subjectUpdate = await admin.put(`${E2E.apiUrl}/admin/subjects/${subject.id}`, {
    headers,
    data: { code: subject.code, name: subject.name, year_level: Number(subject.year_level), order_index: Number(subject.order_index), thumbnail_url: null, is_active: true },
  });
  expect(subjectUpdate.status(), await subjectUpdate.text()).toBeLessThan(300);

  const profile = await one(`SELECT id, full_name FROM profiles WHERE id = 'mock-google-sub-010'`);
  const profileUpdate = await admin.put(`${E2E.apiUrl}/admin/profiles/${profile.id}`, {
    headers,
    data: { full_name: profile.full_name, student_id: null, year_level: 3, role: 'student' },
  });
  expect(profileUpdate.status(), await profileUpdate.text()).toBeLessThan(300);
});

test('malformed bodies are rejected with 400', async () => {
  const missingTitle = await admin.post(`${E2E.apiUrl}/admin/announcements`, { headers, data: { content: 'no title' } });
  expect(missingTitle.status()).toBe(400);

  const badDates = await admin.post(`${E2E.apiUrl}/admin/calendar`, {
    headers,
    data: { title: 'Backwards', type: 'event', start_date: '2026-11-05', end_date: '2026-11-01' },
  });
  expect(badDates.status()).toBe(400);

  const badReorder = await admin.patch(`${E2E.apiUrl}/admin/subjects/reorder`, { headers, data: { items: [{ id: 'not-a-uuid', order_index: -1 }] } });
  expect(badReorder.status()).toBe(400);

  const badYear = await admin.put(`${E2E.apiUrl}/admin/profiles/mock-google-sub-010`, { headers, data: { year_level: 9 } });
  expect(badYear.status()).toBe(400);
});

test('drag-reorder saves send order-only payloads', async () => {
  const card = await one(`SELECT id, order_index FROM learning_resources ORDER BY order_index LIMIT 1`);
  const lh = await admin.put(`${E2E.apiUrl}/admin/learning-resources/${card.id}`, { headers, data: { order_index: Number(card.order_index) } });
  expect(lh.status(), await lh.text()).toBeLessThan(300);

  const member = await one(`SELECT id, order_index FROM team_members ORDER BY order_index LIMIT 1`);
  const team = await admin.put(`${E2E.apiUrl}/admin/team-members/${member.id}`, { headers, data: { order_index: Number(member.order_index) } });
  expect(team.status(), await team.text()).toBeLessThan(300);

  const type = await one(`SELECT id, sort_order FROM event_types ORDER BY sort_order LIMIT 1`);
  const types = await admin.put(`${E2E.apiUrl}/admin/event-types/${type.id}`, { headers, data: { sort_order: Number(type.sort_order) } });
  expect(types.status(), await types.text()).toBeLessThan(300);
});

test('tree version endpoint reports the current version', async () => {
  const subject = await one(`SELECT id FROM subjects WHERE code = 'MDAN101'`);
  const [tree, version] = await Promise.all([
    admin.get(`${E2E.apiUrl}/admin/subjects/${subject.id}/tree`, { headers }),
    admin.get(`${E2E.apiUrl}/admin/subjects/${subject.id}/tree/version`, { headers }),
  ]);
  expect(version.status()).toBe(200);
  expect((await version.json()).data.tree_version).toBe((await tree.json()).data.tree_version);
});
