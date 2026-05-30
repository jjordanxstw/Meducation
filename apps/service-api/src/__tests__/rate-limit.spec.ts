/**
 * Integration test for the auth rate limiter (8.2).
 *
 * Replicates the production express-rate-limit config from main.ts against a
 * minimal express app with an in-memory store (the default; no redis), fires 6
 * rapid invalid POSTs and asserts the 6th is throttled with 429 + RATE_LIMITED.
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';

function buildApp() {
  const app = express();
  app.use(express.json());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
      error: 'Too many authentication attempts',
      errorCode: 'RATE_LIMITED',
      message: 'Please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  });

  app.use('/api/v1/auth/verify', authLimiter);
  // Stub handler that always rejects the token (so requests count towards limit).
  app.post('/api/v1/auth/verify', (_req, res) => {
    res.status(401).json({ error: 'invalid token' });
  });

  return app;
}

describe('Auth rate limiting', () => {
  it('returns 429 with RATE_LIMITED on the 6th invalid attempt', async () => {
    const app = buildApp();

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).post('/api/v1/auth/verify').send({ idToken: 'bad' });
      expect(res.status).toBe(401);
    }

    const throttled = await request(app).post('/api/v1/auth/verify').send({ idToken: 'bad' });
    expect(throttled.status).toBe(429);
    expect(throttled.body.errorCode).toBe('RATE_LIMITED');
  });
});
