import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoEquipo, EstadoReserva, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Actor, AuditoriaService } from '../auditoria/auditoria.service';
import { CrearReservaDto } from './dto/crear-reserva.dto';
import { FiltroReservasDto } from './dto/filtro-reservas.dto';

function minutosEnBogota(fecha: Date) {
  const [hora, minuto] = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota',
  })
    .format(fecha)
    .split(':')
    .map(Number);
  return (hora === 24 ? 0 : hora) * 60 + minuto;
}

@Injectable()
export class ReservasService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService,
  ) {}

  async crear(dto: CrearReservaDto, actor?: Actor) {
    const inicio = new Date(dto.inicio);
    const fin = new Date(dto.fin);

    if (fin <= inicio) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio');
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const equipo = await tx.equipo.findUnique({ where: { id: dto.equipoId } });
          if (!equipo) throw new NotFoundException('Equipo no encontrado');
          if (equipo.estado === EstadoEquipo.MANTENIMIENTO) {
            throw new BadRequestException('El equipo está en mantenimiento y no se puede reservar');
          }

          if (equipo.horaApertura !== null || equipo.horaCierre !== null) {
            const apertura = (equipo.horaApertura ?? 0) * 60;
            const cierre = (equipo.horaCierre ?? 24) * 60;
            const desde = minutosEnBogota(inicio);
            let hasta = minutosEnBogota(fin);
            if (hasta === 0) hasta = 24 * 60;
            if (desde < apertura || hasta > cierre || hasta < desde) {
              throw new BadRequestException(
                `Este equipo solo se puede reservar entre las ${equipo.horaApertura ?? 0}:00 y las ${equipo.horaCierre ?? 24}:00`,
              );
            }
          }

          const conflicto = await tx.reserva.findFirst({
            where: {
              equipoId: dto.equipoId,
              estado: EstadoReserva.ACTIVA,
              inicio: { lt: fin },
              fin: { gt: inicio },
            },
          });
          if (conflicto) {
            throw new ConflictException('El equipo ya está reservado en esa franja horaria');
          }

          const reserva = await tx.reserva.create({
            data: {
              equipoId: dto.equipoId,
              nombreUsuario: dto.nombreUsuario,
              correoUsuario: dto.correoUsuario,
              inicio,
              fin,
            },
          });

          const ahora = new Date();
          if (inicio <= ahora && ahora < fin) {
            await tx.equipo.update({
              where: { id: dto.equipoId },
              data: { estado: EstadoEquipo.RESERVADO },
            });
          }

          return { reserva, nombreEquipo: equipo.nombre };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ).then(async ({ reserva, nombreEquipo }) => {
        if (actor) {
          await this.auditoria.registrar({
            accion: 'RESERVA_CREADA',
            entidad: 'reserva',
            entidadId: reserva.id,
            detalle: `${nombreEquipo}: ${reserva.inicio.toISOString()} → ${reserva.fin.toISOString()}`,
            actor,
          });
        }
        return reserva;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
        throw new ConflictException('El equipo ya está reservado en esa franja horaria');
      }
      throw e;
    }
  }

  async cancelar(id: string, usuario?: { nombre: string; correo: string; rol: string }) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');
    if (reserva.estado === EstadoReserva.CANCELADA) {
      throw new BadRequestException('La reserva ya fue cancelada');
    }
    if (usuario && usuario.rol !== 'ADMIN' && reserva.correoUsuario !== usuario.correo) {
      throw new ForbiddenException('Solo puedes cancelar tus propias reservas');
    }

    return this.prisma.$transaction(async (tx) => {
      const cancelada = await tx.reserva.update({
        where: { id },
        data: { estado: EstadoReserva.CANCELADA },
      });

      const equipo = await tx.equipo.findUnique({ where: { id: reserva.equipoId } });
      if (equipo && equipo.estado !== EstadoEquipo.MANTENIMIENTO) {
        const ahora = new Date();
        const activaAhora = await tx.reserva.findFirst({
          where: {
            equipoId: reserva.equipoId,
            estado: EstadoReserva.ACTIVA,
            inicio: { lte: ahora },
            fin: { gt: ahora },
          },
        });
        await tx.equipo.update({
          where: { id: reserva.equipoId },
          data: { estado: activaAhora ? EstadoEquipo.RESERVADO : EstadoEquipo.DISPONIBLE },
        });
      }

      if (usuario) {
        await this.auditoria.registrar({
          accion: 'RESERVA_CANCELADA',
          entidad: 'reserva',
          entidadId: cancelada.id,
          detalle: `${equipo?.nombre ?? reserva.equipoId}: ${reserva.inicio.toISOString()} → ${reserva.fin.toISOString()}`,
          actor: { nombre: usuario.nombre, correo: usuario.correo },
        });
      }

      return cancelada;
    });
  }

  async listar(filtro: FiltroReservasDto) {
    const { equipoId, correo, estado, desde, hasta, pagina = 1, limite = 10 } = filtro;

    const where: Prisma.ReservaWhereInput = {
      ...(equipoId && { equipoId }),
      ...(correo && { correoUsuario: correo }),
      ...(estado && { estado }),
      ...((desde || hasta) && {
        inicio: {
          ...(desde && { gte: new Date(desde) }),
          ...(hasta && { lte: new Date(hasta) }),
        },
      }),
    };

    const [datos, total] = await Promise.all([
      this.prisma.reserva.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { inicio: 'desc' },
        include: { equipo: { select: { nombre: true, serial: true, categoria: true } } },
      }),
      this.prisma.reserva.count({ where }),
    ]);

    return { datos, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
  }
}
