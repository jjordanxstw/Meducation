import { Global, Module } from '@nestjs/common';
import { ResponseCacheService } from './utils/response-cache.service';

@Global()
@Module({
  providers: [ResponseCacheService],
  exports: [ResponseCacheService],
})
export class CommonModule {}
