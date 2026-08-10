import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Actor, AuditoriaService } from '../auditoria/auditoria.service';

const CAMPOS_PUBLICOS = { id: true, nombre: true, correo: true, rol: true, creadoEn: true };

@Injectable()
export class UsuariosService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService,
  ) {}

  async listar(buscar?: string, pagina = 1, limite = 10) {
    const where: Prisma.UsuarioWhereInput = buscar
      ? {
          OR: [
            { nombre: { contains: buscar, mode: 'insensitive' } },
            { correo: { contains: buscar, mode: 'insensitive' } },
          ],
        }
      : {};

    const [datos, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: CAMPOS_PUBLICOS,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { creadoEn: 'desc' },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return { datos, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
  }

  async cambiarRol(id: string, rol: Rol, solicitante: Actor & { id: string }) {
    if (id === solicitante.id) {
      throw new BadRequestException('No puedes cambiar tu propio rol');
    }
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const actualizado = await this.prisma.usuario.update({
      where: { id },
      data: { rol },
      select: CAMPOS_PUBLICOS,
    });

    await this.auditoria.registrar({
      accion: 'ROL_CAMBIADO',
      entidad: 'usuario',
      entidadId: id,
      detalle: `${usuario.correo}: ${usuario.rol} → ${rol}`,
      actor: solicitante,
    });

    return actualizado;
  }
}
