import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServiceApiController } from './service-api.controller';
import { ServiceApiService } from './service-api.service';
import { V1Module } from './modules/v1/v1.module';
import { CommonModule } from './common';

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
    V1Module,
  ],
  controllers: [ServiceApiController],
  providers: [ServiceApiService],
})
export class ServiceApiModule {}
