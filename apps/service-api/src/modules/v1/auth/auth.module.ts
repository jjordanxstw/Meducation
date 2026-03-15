/**
 * Auth Module
 * Handles authentication and authorization
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { WatermarkService } from './services/watermark.service';
import { RefreshTokenService } from './services/refresh-token.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
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
  controllers: [AuthController],
  providers: [AuthService, WatermarkService, RefreshTokenService],
  exports: [AuthService, WatermarkService, RefreshTokenService],
})
export class AuthModule {}
