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
    description: 'New password (min 8 chars, must include uppercase, lowercase, number)',
    example: 'NewSecurePass456',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword!: string;

  @ApiProperty({
    description: 'Confirm new password (must match new password)',
    example: 'NewSecurePass456',
  })
  @IsNotEmpty({ message: 'Password confirmation is required' })
  @IsString()
  confirmPassword!: string;
}
