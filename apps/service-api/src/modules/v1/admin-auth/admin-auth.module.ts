/**
 * Admin Auth Module
 * Handles admin authentication with username/password
 * Separate from student OAuth authentication
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminRefreshTokenService } from './services/admin-refresh-token.service';
import { AdminAuthController } from './controllers/admin-auth.controller';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      },
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminRefreshTokenService],
  exports: [AdminAuthService, AdminRefreshTokenService],
})
export class AdminAuthModule {}
