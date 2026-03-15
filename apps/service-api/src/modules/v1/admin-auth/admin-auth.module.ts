/**
 * Admin Auth Module
 * Handles admin authentication with username/password
 * Separate from student OAuth authentication
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminRefreshTokenService } from './services/admin-refresh-token.service';
import { AdminAuthController } from './controllers/admin-auth.controller';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');

        if (!jwtSecret) {
          throw new Error('Missing required environment variable: JWT_SECRET');
        }

        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '15m') as StringValue;

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminRefreshTokenService],
  exports: [AdminAuthService, AdminRefreshTokenService],
})
export class AdminAuthModule {}
