import { UserWithoutPassword } from '../entities/profile.entity';

export class AuthTokenDto {
  readonly tokenType = 'Bearer' as const;

  constructor(
    readonly accessToken: string,
    readonly expiresIn: number,
  ) {}
}

export class AuthResponseDto {
  constructor(
    readonly message: string,
    readonly user: UserWithoutPassword,
    readonly token: AuthTokenDto | null,
  ) {}
}
