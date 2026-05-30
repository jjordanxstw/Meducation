import { ErrorCode } from '@medical-portal/shared';
import { AppException } from '../../../../common/errors';

const mockVerifyIdToken = jest.fn();
const mockRevokeToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
    revokeToken: mockRevokeToken,
  })),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: jest.fn() })),
}));

// Imported after the mocks are registered.
import { AuthService } from './auth.service';

function buildConfig(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    GOOGLE_CLIENT_ID: 'client-id',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    JWT_SECRET: 'jwt-secret',
    JWT_EXPIRES_IN: '1h',
    ALLOWED_EMAIL_DOMAINS: '@student.mahidol.edu',
    ...overrides,
  };
  return {
    get: <T = string>(key: string, fallback?: T): T => (values[key] as unknown as T) ?? (fallback as T),
  };
}

function buildJwt() {
  return {
    signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
    verifyAsync: jest.fn(),
  };
}

function createService(configOverrides: Record<string, string> = {}) {
  return new AuthService(buildJwt() as never, buildConfig(configOverrides) as never);
}

const futureExp = Math.floor(Date.now() / 1000) + 3600;
const pastExp = Math.floor(Date.now() / 1000) - 3600;

beforeEach(() => {
  mockVerifyIdToken.mockReset();
  mockRevokeToken.mockReset();
});

describe('AuthService.verifyGoogleToken', () => {
  it('returns the payload on a valid, unexpired token', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'g-1', email: 'a@student.mahidol.edu', exp: futureExp }),
    });
    const service = createService();

    const payload = await service.verifyGoogleToken('valid-token');

    expect(payload?.email).toBe('a@student.mahidol.edu');
    expect(mockVerifyIdToken).toHaveBeenCalledWith(
      expect.objectContaining({ idToken: 'valid-token', audience: 'client-id' }),
    );
  });

  it('returns null when verification throws', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('invalid signature'));
    const service = createService();

    await expect(service.verifyGoogleToken('bad-token')).resolves.toBeNull();
  });

  it('throws AUTH_TOKEN_EXPIRED for a stale token', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'g-1', email: 'a@student.mahidol.edu', exp: pastExp }),
    });
    const service = createService();

    await expect(service.verifyGoogleToken('stale-token')).rejects.toMatchObject({
      errorCode: ErrorCode.AUTH_TOKEN_EXPIRED,
    });
  });
});

describe('AuthService.verifyCredential', () => {
  it('rejects emails outside the allowed domains', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'g-2', email: 'attacker@gmail.com', exp: futureExp }),
    });
    const service = createService();

    await expect(service.verifyCredential('token')).rejects.toMatchObject({
      errorCode: ErrorCode.AUTHZ_FORBIDDEN,
    });
  });

  it('rejects an invalid Google token before any profile work', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('bad token'));
    const service = createService();

    await expect(service.verifyCredential('token')).rejects.toBeInstanceOf(AppException);
  });
});
