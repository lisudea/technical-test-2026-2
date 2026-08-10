import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (!roles?.length) return true;

    const { user } = contexto.switchToHttp().getRequest();
    return roles.includes(user?.rol);
  }
}
