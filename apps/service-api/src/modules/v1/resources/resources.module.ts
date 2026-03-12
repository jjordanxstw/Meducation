/**
 * Resources Module
 * Handles resource management
 */

import { Module } from '@nestjs/common';
import { ResourcesController } from './controllers/resources.controller';
import { ResourcesService } from './services/resources.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
