import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Change Password DTO
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldPass123',
  })
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    description:
      'New password: min 12 chars with at least one uppercase, lowercase, digit and special character',
    example: 'New$ecurePass456',
    minLength: 12,
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(12, { message: 'New password must be at least 12 characters' })
  @Matches(/[a-z]/, { message: 'New password must contain at least one lowercase letter' })
  @Matches(/[A-Z]/, { message: 'New password must contain at least one uppercase letter' })
  @Matches(/\d/, { message: 'New password must contain at least one digit' })
  @Matches(/[^A-Za-z0-9]/, { message: 'New password must contain at least one special character' })
  newPassword!: string;

  @ApiProperty({
    description: 'Confirm new password (must match new password)',
    example: 'NewSecurePass456',
  })
  @IsNotEmpty({ message: 'Password confirmation is required' })
  @IsString()
  confirmPassword!: string;
}
