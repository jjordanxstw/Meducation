import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import { ServiceApiModule } from './service-api.module';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ServiceApiModule, {
    bodyParser: false,
  });
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  const port = Number(configService.get<number>('PORT')) || 3001;

  // JSON body parser
  app.use(express.json());

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
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://localhost:5174')
    .split(',');

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow: boolean) => void) => {
      const allowedOrigins = [
        ...corsOrigins,
        undefined, // Allow requests with no origin (API tools like Apidog, Postman, curl)
      ];
      // Allow Apidog and other common API testing origins
      const apidogOrigins = [
        'https://apidog.com',
        'https://app.apidog.com',
        'chrome-extension://*', // Apidog Chrome extension
      ];

      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        apidogOrigins.some((o) => origin.includes(o.replace('*', '')))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  await app.listen(port);
  console.log(`Medical Learning Portal API running on port ${port}`);
  console.log(`API: http://localhost:${port}/api`);
}
void bootstrap();
