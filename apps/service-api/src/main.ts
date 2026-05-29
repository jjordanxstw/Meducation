import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ServiceApiModule } from './service-api.module';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';
import { StructuredLogger } from './common/logger/structured-logger';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import * as express from 'express';

const logger = new Logger('Bootstrap');

function parseCsvEnv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  for (const allowed of allowedOrigins) {
    if (!allowed.includes('*')) {
      continue;
    }

    // Support wildcard patterns such as https://*.vercel.app
    if (allowed.includes('://')) {
      const pattern = `^${escapeRegex(allowed).replace(/\\\*/g, '.*')}$`;
      if (new RegExp(pattern).test(origin)) {
        return true;
      }
      continue;
    }

    // Support bare host wildcards such as *.vercel.app
    if (allowed.startsWith('*.')) {
      const suffix = allowed.slice(1); // keep leading dot
      if (originUrl.hostname.endsWith(suffix)) {
        return true;
      }
    }
  }

  return false;
}

function validateRequiredConfig(configService: ConfigService): void {
  const requiredVariables = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];

  for (const key of requiredVariables) {
    const value = configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

function isPlaceholderValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  const placeholderTokens = [
    'change-this',
    'replace-with',
    'your-',
    'example.com',
    'your-project',
  ];

  return placeholderTokens.some((token) => normalized.includes(token));
}

function validateProductionSecrets(configService: ConfigService): void {
  const nodeEnv = configService.get<string>('NODE_ENV')?.toLowerCase();
  if (nodeEnv !== 'production') {
    return;
  }

  const criticalKeys = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'WATERMARK_SECRET',
  ];

  for (const key of criticalKeys) {
    const value = configService.get<string>(key);
    if (!value) {
      continue;
    }

    if (isPlaceholderValue(value)) {
      throw new Error(`Invalid placeholder-like value detected for environment variable: ${key}`);
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ServiceApiModule, {
    bodyParser: false,
    bufferLogs: true,
  });
  // Structured JSON logging in production, pretty output in development.
  app.useLogger(new StructuredLogger());
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  validateRequiredConfig(configService);
  validateProductionSecrets(configService);

  const port = Number(configService.get<number>('PORT')) || 3001;
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Trust the first proxy hop. In production the API runs behind Render's reverse
  // proxy, which injects X-Forwarded-For. Without this, express-rate-limit (and
  // req.ip) would see the proxy's IP and apply limits globally rather than
  // per-client. This is only safe because Render terminates TLS and sets the
  // header itself; never enable a broader trust setting on an untrusted edge.
  app.set('trust proxy', 1);

  // Content-Security-Policy sources. connectSrc must allow the Supabase project
  // so the browser can reach the backing API/storage.
  const supabaseUrl = configService.get<string>('SUPABASE_URL');
  const cspDirectives: Record<string, string[] | null> = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind / Ant Design inline styles
    imgSrc: ["'self'", 'data:', 'https://lh3.googleusercontent.com'], // Google avatars
    connectSrc: ["'self'", ...(supabaseUrl ? [supabaseUrl] : [])],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
  };
  if (isProduction) {
    // Force https for any accidental http subresource in production only.
    cspDirectives.upgradeInsecureRequests = [];
  }

  // Security headers via Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: cspDirectives,
    },
    crossOriginEmbedderPolicy: false, // Allow embedding external resources if needed
    frameguard: { action: 'deny' }, // Prevent clickjacking
    xssFilter: true,
    noSniff: true,
  }));

  // Permissions-Policy is not configurable through Helmet 7, so set it directly.
  app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Rate limiting for authentication endpoints (prevent brute force)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window per IP
    message: {
      error: 'Too many authentication attempts',
      errorCode: 'RATE_LIMITED',
      message: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
  });

  // Stricter rate limit for password operations
  const passwordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
      error: 'Too many password attempts',
      errorCode: 'PASSWORD_RATE_LIMITED',
      message: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting to auth endpoints
  // Note: Paths must include /api/v1/ prefix to match actual endpoint paths
  app.use('/api/v1/admin/auth/login', authLimiter);
  app.use('/api/v1/auth/verify', authLimiter);
  app.use('/api/v1/admin/auth/change-password', passwordLimiter);

  // JSON body parser with size limit to prevent DoS
  app.use(express.json({ limit: '10kb' }));

  // Cookie parser for httpOnly cookie support
  app.use(cookieParser());

  // Enable compression
  app.use(compression());

  // Add request ID middleware first (before versioning)
  app.use(requestIdMiddleware);

  // Set global API prefix. Health probe routes are excluded so orchestrators
  // (Render) can hit stable, unversioned paths.
  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/ready', 'health/live'],
  });

  // Enable URI versioning for all endpoints
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Enable global validation
  app.useGlobalPipes(new GlobalValidationPipe());

  // Global request timeout (503 after 30s; @SkipTimeout() opts out).
  app.useGlobalInterceptors(new TimeoutInterceptor(reflector));

  // Enable global response envelope interceptor
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor(reflector));

  // Enable global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable CORS for frontend integration and API testing tools
  const corsOrigins = parseCsvEnv(
    configService.get<string>(
      'CORS_ORIGINS',
      'http://localhost:3000,http://localhost:5173,http://localhost:5174'
    )
  );
  const extensionOrigins = parseCsvEnv(configService.get<string>('CORS_EXTENSION_ORIGINS', ''));
  const allowedOrigins = [...corsOrigins, ...extensionOrigins];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow: boolean) => void) => {
      // Allow requests with no origin (CLI/API tools like curl or server-to-server calls)
      if (!origin || isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id', 'Idempotency-Key'],
    exposedHeaders: ['X-Request-Id', 'Idempotency-Replayed', 'Deprecation'],
  });

  // OpenAPI / Swagger — never exposed in production. Behind HTTP basic auth.
  const appEnvForDocs = configService.get<string>('APP_ENV')?.trim().toLowerCase();
  if (appEnvForDocs !== 'prod') {
    const swaggerPassword = configService.get<string>('SWAGGER_PASSWORD');
    if (appEnvForDocs === 'uat' && !swaggerPassword) {
      throw new Error('SWAGGER_PASSWORD must be set when APP_ENV=uat to protect API docs');
    }

    // Basic-auth gate (username: admin). Skipped only when no password is
    // configured in local development.
    if (swaggerPassword) {
      app.use(['/api/docs', '/api/docs-json'], (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const header = req.headers.authorization ?? '';
        const [scheme, encoded] = header.split(' ');
        if (scheme === 'Basic' && encoded) {
          const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
          if (user === 'admin' && pass === swaggerPassword) {
            return next();
          }
        }
        res.setHeader('WWW-Authenticate', 'Basic realm="API Docs"');
        res.status(401).send('Authentication required');
      });
    }

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Medical Learning Portal API')
      .setDescription('Student & admin API for the medical learning portal')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addCookieAuth('admin_access_token')
      .addCookieAuth('student_access_token')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs-json' });
    logger.log(`API docs available at /api/docs`);
  }

  await app.listen(port);
  logger.log(`Medical Learning Portal API running on port ${port}`);
  logger.log(`API: http://localhost:${port}/api`);
}
void bootstrap();
