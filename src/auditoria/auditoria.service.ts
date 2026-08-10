import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface Actor {
  nombre: string;
  correo: string;
}

export interface FiltroAuditoria {
  accion?: string;
  entidad?: string;
  buscar?: string;
  desde?: string;
  hasta?: string;
  pagina?: number;
  limite?: number;
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private prisma: PrismaService) {}

  async registrar(datos: {
    accion: string;
    entidad: string;
    entidadId?: string;
    detalle: string;
    actor: Actor;
  }) {
    try {
      await this.prisma.auditoria.create({
        data: {
          accion: datos.accion,
          entidad: datos.entidad,
          entidadId: datos.entidadId,
          detalle: datos.detalle,
          actorNombre: datos.actor.nombre,
          actorCorreo: datos.actor.correo,
        },
      });
    } catch (e) {
      this.logger.warn(`No se pudo registrar auditoría: ${e}`);
    }
  }

  async listar(filtro: FiltroAuditoria) {
    const { accion, entidad, buscar, desde, hasta, pagina = 1, limite = 15 } = filtro;

    const where: Prisma.AuditoriaWhereInput = {
      ...(accion && { accion }),
      ...(entidad && { entidad }),
      ...(buscar && {
        OR: [
          { actorNombre: { contains: buscar, mode: 'insensitive' } },
          { actorCorreo: { contains: buscar, mode: 'insensitive' } },
          { detalle: { contains: buscar, mode: 'insensitive' } },
        ],
      }),
      ...((desde || hasta) && {
        creadoEn: {
          ...(desde && { gte: new Date(desde) }),
          ...(hasta && { lte: new Date(hasta) }),
        },
      }),
    };

    const [datos, total] = await Promise.all([
      this.prisma.auditoria.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { creadoEn: 'desc' },
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return { datos, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
  }
}
