import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { UserRole } from '../../users/schemas/user.schema.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private customReflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.customReflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
