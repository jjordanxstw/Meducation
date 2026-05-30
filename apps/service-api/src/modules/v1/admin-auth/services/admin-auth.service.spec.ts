import { ErrorCode } from '@medical-portal/shared';

const mockCompare = jest.fn();
const mockHash = jest.fn();

jest.mock('bcrypt', () => ({
  compare: (...args: unknown[]) => mockCompare(...args),
  hash: (...args: unknown[]) => mockHash(...args),
}));

// Configurable result for the next `.single()` call.
let nextSingleResult: { data: unknown; error: unknown } = { data: null, error: null };

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  Object.assign(builder, {
    select: chain,
    eq: chain,
    is: chain,
    gte: chain,
    order: chain,
    update: chain,
    insert: () => Promise.resolve({ error: null }),
    single: () => Promise.resolve(nextSingleResult),
    // Awaiting update().eq() resolves here.
    then: (resolve: (v: { error: null }) => unknown) => resolve({ error: null }),
  });
  return builder;
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: () => makeBuilder() })),
}));

import { AdminAuthService } from './admin-auth.service';

function buildConfig() {
  const values: Record<string, string> = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    JWT_SECRET: 'jwt-secret',
    JWT_EXPIRES_IN: '1h',
  };
  return { get: <T = string>(k: string, d?: T): T => (values[k] as unknown as T) ?? (d as T) };
}

function buildJwt() {
  return {
    signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
    verifyAsync: jest.fn(),
  };
}

function createService() {
  return new AdminAuthService(buildJwt() as never, buildConfig() as never);
}

const activeAdmin = {
  id: 'a-1',
  username: 'admin',
  password_hash: 'stored-hash',
  is_active: true,
  is_super_admin: false,
  full_name: 'Admin',
  email: 'admin@example.com',
  last_login_ip: null,
  password_history: [],
};

beforeEach(() => {
  mockCompare.mockReset();
  mockHash.mockReset();
  nextSingleResult = { data: null, error: null };
});

describe('AdminAuthService.login', () => {
  it('returns an access token on valid credentials', async () => {
    nextSingleResult = { data: activeAdmin, error: null };
    mockCompare.mockResolvedValue(true);
    const service = createService();

    const result = await service.login('admin', 'correct-password');

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.admin.username).toBe('admin');
    // Sanitized response must not leak the password hash.
    expect((result.admin as Record<string, unknown>).password_hash).toBeUndefined();
  });

  it('rejects a wrong password with AUTH_INVALID_CREDENTIALS', async () => {
    nextSingleResult = { data: activeAdmin, error: null };
    mockCompare.mockResolvedValue(false);
    const service = createService();

    await expect(service.login('admin', 'wrong')).rejects.toMatchObject({
      errorCode: ErrorCode.AUTH_INVALID_CREDENTIALS,
    });
  });

  it('does not reveal whether the user exists (same error as wrong password)', async () => {
    nextSingleResult = { data: null, error: { code: 'PGRST116' } };
    const service = createService();

    await expect(service.login('ghost', 'whatever')).rejects.toMatchObject({
      errorCode: ErrorCode.AUTH_INVALID_CREDENTIALS,
    });
  });
});
