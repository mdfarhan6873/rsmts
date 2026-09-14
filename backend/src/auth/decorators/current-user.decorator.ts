import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../users/schemas/user.schema.js';

export interface CurrentUserPayload {
  _id: string;
  role: UserRole;
  email: string;
  name?: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
