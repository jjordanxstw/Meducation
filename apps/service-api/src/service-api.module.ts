import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServiceApiController } from './service-api.controller';
import { V1Module } from './modules/v1/v1.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    V1Module,
  ],
  controllers: [ServiceApiController],
})
export class ServiceApiModule {}
