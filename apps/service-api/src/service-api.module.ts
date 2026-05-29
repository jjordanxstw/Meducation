import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServiceApiController } from './service-api.controller';
import { ServiceApiService } from './service-api.service';
import { V1Module } from './modules/v1/v1.module';
import { HealthModule } from './modules/health/health.module';
import { CommonModule, LoggerMiddleware } from './common';

const appEnv = process.env.APP_ENV?.trim();
const nodeEnv = process.env.NODE_ENV?.trim();
const envFilePath = ['.env.local'];

if (appEnv) {
  envFilePath.push(`.env.${appEnv}`);
}

if (nodeEnv && nodeEnv !== appEnv) {
  envFilePath.push(`.env.${nodeEnv}`);
}

envFilePath.push('.env');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),
    CommonModule,
    HealthModule,
    V1Module,
  ],
  controllers: [ServiceApiController],
  providers: [ServiceApiService],
})
export class ServiceApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Structured request-completion access logging on every route.
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
