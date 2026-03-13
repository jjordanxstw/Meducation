import { ApiProperty } from '@nestjs/swagger';

/**
 * Admin Login Response DTO
 */
export class AdminLoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Admin user information',
    type: 'object',
    properties: {
      id: { type: 'string' },
      username: { type: 'string' },
      full_name: { type: 'string' },
      email: { type: 'string' },
      is_active: { type: 'boolean' },
      is_super_admin: { type: 'boolean' },
    },
  })
  admin: {
    id: string;
    username: string;
    full_name: string;
    email?: string;
    is_active: boolean;
    is_super_admin: boolean;
  };

  constructor(accessToken: string, expiresIn: number, admin: any) {
    this.accessToken = accessToken;
    this.expiresIn = expiresIn;
    this.admin = admin;
  }
}

/**
 * Change Password Response DTO
 */
export class ChangePasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password changed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp of password change',
    example: '2025-01-15T10:30:00Z',
  })
  changedAt: string;

  constructor(message: string, changedAt: Date) {
    this.message = message;
    this.changedAt = changedAt.toISOString();
  }
}
