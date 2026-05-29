import { Global, Module } from '@nestjs/common';
import { ResponseCacheService } from './utils/response-cache.service';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';

@Global()
@Module({
  providers: [ResponseCacheService, IdempotencyInterceptor],
  exports: [ResponseCacheService, IdempotencyInterceptor],
})
export class CommonModule {}
