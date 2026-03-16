import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { ServiceApiModule } from './service-api.module';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
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
  });
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  validateRequiredConfig(configService);
  validateProductionSecrets(configService);

  const port = Number(configService.get<number>('PORT')) || 3001;

  // JSON body parser
  app.use(express.json());

  // Cookie parser for httpOnly cookie support
  app.use(cookieParser());

  // Enable compression
  app.use(compression());

  // Add request ID middleware first (before versioning)
  app.use(requestIdMiddleware);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable URI versioning for all endpoints
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Enable global validation
  app.useGlobalPipes(new GlobalValidationPipe());

  // Enable global logging interceptor (now with request ID)
  app.useGlobalInterceptors(new LoggingInterceptor());

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
  });

  await app.listen(port);
  logger.log(`Medical Learning Portal API running on port ${port}`);
  logger.log(`API: http://localhost:${port}/api`);
}
void bootstrap();
