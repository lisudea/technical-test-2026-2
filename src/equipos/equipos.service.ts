import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Actor, AuditoriaService } from '../auditoria/auditoria.service';
import { CrearEquipoDto } from './dto/crear-equipo.dto';
import { ActualizarEquipoDto } from './dto/actualizar-equipo.dto';
import { FiltroEquiposDto } from './dto/filtro-equipos.dto';

@Injectable()
export class EquiposService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService,
  ) {}

  async crear(dto: CrearEquipoDto, actor?: Actor) {
    try {
      const equipo = await this.prisma.equipo.create({ data: dto });
      if (actor) {
        await this.auditoria.registrar({
          accion: 'EQUIPO_CREADO',
          entidad: 'equipo',
          entidadId: equipo.id,
          detalle: `${equipo.nombre} (${equipo.serial})`,
          actor,
        });
      }
      return equipo;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Ya existe un equipo con ese serial');
      }
      throw e;
    }
  }

  async listar(filtro: FiltroEquiposDto) {
    const { categoria, estado, buscar, pagina = 1, limite = 10 } = filtro;

    const where: Prisma.EquipoWhereInput = {
      ...(categoria && { categoria }),
      ...(estado && { estado }),
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { serial: { contains: buscar, mode: 'insensitive' } },
        ],
      }),
    };

    const [datos, total] = await Promise.all([
      this.prisma.equipo.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { creadoEn: 'desc' },
      }),
      this.prisma.equipo.count({ where }),
    ]);

    return { datos, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
  }

  async obtener(id: string) {
    const equipo = await this.prisma.equipo.findUnique({ where: { id } });
    if (!equipo) throw new NotFoundException('Equipo no encontrado');
    return equipo;
  }

  async disponibilidad(id: string, desde: Date, hasta: Date) {
    await this.obtener(id);
    return this.prisma.reserva.findMany({
      where: {
        equipoId: id,
        estado: 'ACTIVA',
        inicio: { lt: hasta },
        fin: { gt: desde },
      },
      select: { inicio: true, fin: true },
      orderBy: { inicio: 'asc' },
    });
  }

  async actualizar(id: string, dto: ActualizarEquipoDto, actor?: Actor) {
    await this.obtener(id);
    try {
      const equipo = await this.prisma.equipo.update({ where: { id }, data: dto });
      if (actor) {
        await this.auditoria.registrar({
          accion: 'EQUIPO_ACTUALIZADO',
          entidad: 'equipo',
          entidadId: equipo.id,
          detalle: `${equipo.nombre}: ${Object.keys(dto).join(', ')}`,
          actor,
        });
      }
      return equipo;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Ya existe un equipo con ese serial');
      }
      throw e;
    }
  }
}
