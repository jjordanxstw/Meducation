import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * CurrentUser decorator to extract user from request
 * Usage: @CurrentUser('id') userId: string
 * Usage: @CurrentUser() user: CurrentUserType
 */

export interface CurrentUserType {
  id: string;
  email: string;
  name: string;
  picture?: string;
  profile?: {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'student';
    year_level: number;
  };
}

type RequestWithUser = Request & {
  user?: CurrentUserType;
};

type CurrentUserKey = keyof CurrentUserType | 'userId';

export const CurrentUser = createParamDecorator(
  (data: CurrentUserKey | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) {
      return undefined;
    }

    if (!data) {
      return user;
    }

    if (data === 'userId') {
      return user.id;
    }

    return user[data];
  },
);
