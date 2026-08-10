import { Injectable } from '@nestjs/common';
import { EstadoEquipo, EstadoReserva } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EstadisticasService {
  constructor(private prisma: PrismaService) {}

  async topEquipos(limite = 5) {
    const grupos = await this.prisma.reserva.groupBy({
      by: ['equipoId'],
      _count: { equipoId: true },
      orderBy: { _count: { equipoId: 'desc' } },
      take: limite,
    });

    const equipos = await this.prisma.equipo.findMany({
      where: { id: { in: grupos.map((g) => g.equipoId) } },
    });

    return grupos.map((g) => ({
      equipo: equipos.find((e) => e.id === g.equipoId),
      totalReservas: g._count.equipoId,
    }));
  }

  async resumen() {
    const ahora = new Date();
    const inicioHoy = new Date(ahora);
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date(ahora);
    finHoy.setHours(23, 59, 59, 999);
    const hace7Dias = new Date(ahora);
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const [
      totalEquipos,
      porEstado,
      porCategoria,
      totalReservas,
      activas,
      canceladas,
      hoy,
      ultimos7Dias,
      enCursoAhora,
      topUsuarios,
    ] = await Promise.all([
      this.prisma.equipo.count(),
      this.prisma.equipo.groupBy({ by: ['estado'], _count: { _all: true } }),
      this.prisma.equipo.groupBy({ by: ['categoria'], _count: { _all: true } }),
      this.prisma.reserva.count(),
      this.prisma.reserva.count({
        where: { estado: EstadoReserva.ACTIVA, fin: { gt: ahora } },
      }),
      this.prisma.reserva.count({ where: { estado: EstadoReserva.CANCELADA } }),
      this.prisma.reserva.count({
        where: { inicio: { gte: inicioHoy, lte: finHoy } },
      }),
      this.prisma.reserva.count({ where: { creadaEn: { gte: hace7Dias } } }),
      this.prisma.reserva.count({
        where: {
          estado: EstadoReserva.ACTIVA,
          inicio: { lte: ahora },
          fin: { gt: ahora },
        },
      }),
      this.prisma.reserva.groupBy({
        by: ['correoUsuario', 'nombreUsuario'],
        _count: { _all: true },
        orderBy: { _count: { correoUsuario: 'desc' } },
        take: 5,
      }),
    ]);

    const conteoEstados = Object.fromEntries(
      Object.values(EstadoEquipo).map((e) => [
        e,
        porEstado.find((g) => g.estado === e)?._count._all ?? 0,
      ]),
    );

    const equiposOperativos = totalEquipos - conteoEstados[EstadoEquipo.MANTENIMIENTO];
    const porcentajeOcupacion =
      equiposOperativos > 0 ? Math.round((enCursoAhora / equiposOperativos) * 1000) / 10 : 0;

    return {
      equipos: {
        total: totalEquipos,
        porEstado: conteoEstados,
        porCategoria: Object.fromEntries(
          porCategoria.map((g) => [g.categoria, g._count._all]),
        ),
      },
      reservas: {
        total: totalReservas,
        activas,
        canceladas,
        hoy,
        ultimos7Dias,
      },
      ocupacion: {
        enCursoAhora,
        equiposOperativos,
        porcentaje: porcentajeOcupacion,
      },
      topUsuarios: topUsuarios.map((u) => ({
        nombre: u.nombreUsuario,
        correo: u.correoUsuario,
        totalReservas: u._count._all,
      })),
    };
  }
}
