import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Claves de objetos por pool de origen. El catálogo visual (SVG, nombre, rareza)
// vive en el frontend; aquí solo se sortean las claves.
const POOL_BIENVENIDA = ['gorro-lana', 'bufanda-teal', 'insignia-novato'];
const POOL_JUEGO = ['gafas-vr', 'gorro-grad', 'audifonos', 'corbatin', 'insignia-jugador'];
const POOL_FORO = ['medalla-autor'];

const XP_MAX_POR_PARTIDA = 60;

@Injectable()
export class MascotaService {
  constructor(private prisma: PrismaService) {}

  async obtener(usuarioId: string) {
    const [usuario, objetos] = await Promise.all([
      this.prisma.usuario.findUniqueOrThrow({
        where: { id: usuarioId },
        select: { mascotaNombre: true, mascotaXp: true, equipados: true, regaloBienvenida: true },
      }),
      this.prisma.objetoUsuario.findMany({
        where: { usuarioId },
        select: { clave: true, origen: true, obtenidoEn: true },
        orderBy: { obtenidoEn: 'asc' },
      }),
    ]);

    return {
      nombre: usuario.mascotaNombre,
      xp: usuario.mascotaXp,
      equipados: usuario.equipados,
      inventario: objetos,
      regaloBienvenidaPendiente: !usuario.regaloBienvenida,
    };
  }

  async actualizar(usuarioId: string, datos: { nombre?: string; equipados?: string[] }) {
    if (datos.equipados) {
      const propios = await this.prisma.objetoUsuario.findMany({
        where: { usuarioId },
        select: { clave: true },
      });
      const claves = new Set(propios.map((o) => o.clave));
      if (!datos.equipados.every((c) => claves.has(c))) {
        throw new BadRequestException('No puedes equipar un objeto que no posees');
      }
    }

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        ...(datos.nombre !== undefined && { mascotaNombre: datos.nombre.trim().slice(0, 24) || 'Lis' }),
        ...(datos.equipados && { equipados: datos.equipados }),
      },
    });
    return this.obtener(usuarioId);
  }

  async sumarXp(usuarioId: string, puntos: number) {
    const ganados = Math.max(0, Math.min(Math.round(puntos), XP_MAX_POR_PARTIDA));
    const objetoGanado = await this.quizasRegalar(usuarioId, POOL_JUEGO, 0.35, 'juego');
    const usuario = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { mascotaXp: { increment: ganados } },
      select: { mascotaXp: true },
    });
    return { xp: usuario.mascotaXp, ganados, objetoGanado };
  }

  async abrirRegaloBienvenida(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
      select: { regaloBienvenida: true },
    });
    if (usuario.regaloBienvenida) {
      throw new BadRequestException('El regalo de bienvenida ya fue reclamado');
    }
    const objeto = await this.otorgar(usuarioId, this.aleatorio(POOL_BIENVENIDA), 'bienvenida');
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { regaloBienvenida: true },
    });
    return { objetoGanado: objeto };
  }

  // otorga un objeto por primera publicación en el foro (idempotente)
  async regaloPrimeraPublicacion(usuarioId: string): Promise<string | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { regaloForo: true },
    });
    if (!usuario || usuario.regaloForo) return null;
    const clave = await this.otorgar(usuarioId, this.aleatorio(POOL_FORO), 'foro');
    await this.prisma.usuario.update({ where: { id: usuarioId }, data: { regaloForo: true } });
    return clave;
  }

  private aleatorio(pool: string[]) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private async quizasRegalar(usuarioId: string, pool: string[], prob: number, origen: string) {
    if (Math.random() > prob) return null;
    return this.otorgar(usuarioId, this.aleatorio(pool), origen);
  }

  // registra el objeto; si ya lo tenía, devuelve null (no duplica)
  private async otorgar(usuarioId: string, clave: string, origen: string): Promise<string | null> {
    try {
      await this.prisma.objetoUsuario.create({ data: { usuarioId, clave, origen } });
      return clave;
    } catch {
      return null;
    }
  }
}
