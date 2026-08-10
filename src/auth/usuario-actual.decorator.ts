import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UsuarioAutenticado {
  id: string;
  correo: string;
  nombre: string;
  rol: string;
}

export const UsuarioActual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsuarioAutenticado =>
    ctx.switchToHttp().getRequest().user,
);
