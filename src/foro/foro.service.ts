import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoriaForo, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MascotaService } from '../mascota/mascota.service';
import { ModeracionService } from './moderacion.service';
import { CrearPublicacionDto, FiltroForoDto } from './foro.controller';

@Injectable()
export class ForoService {
  constructor(
    private prisma: PrismaService,
    private mascota: MascotaService,
    private moderacion: ModeracionService,
  ) {}

  async listar(filtro: FiltroForoDto) {
    const { categoria, pagina = 1, limite = 10 } = filtro;
    const where: Prisma.PublicacionWhereInput = categoria ? { categoria } : {};

    const [datos, total] = await Promise.all([
      this.prisma.publicacion.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { creadaEn: 'desc' },
      }),
      this.prisma.publicacion.count({ where }),
    ]);

    return { datos, total, pagina, limite, totalPaginas: Math.ceil(total / limite) };
  }

  async obtener(id: string) {
    const publicacion = await this.prisma.publicacion.findUnique({ where: { id } });
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');
    return publicacion;
  }

  async crear(
    usuario: { id: string; nombre: string },
    dto: CrearPublicacionDto & { categoria: CategoriaForo },
  ) {
    await this.moderacion.revisar(dto);

    const publicacion = await this.prisma.publicacion.create({
      data: {
        autorId: usuario.id,
        autorNombre: usuario.nombre,
        titulo: dto.titulo,
        contenido: dto.contenido,
        categoria: dto.categoria,
        area: dto.area ?? null,
      },
    });
    const objetoGanado = await this.mascota.regaloPrimeraPublicacion(usuario.id);
    return { publicacion, objetoGanado };
  }

  async eliminar(usuario: { id: string; rol: string }, id: string) {
    const publicacion = await this.obtener(id);
    if (usuario.rol !== 'ADMIN' && publicacion.autorId !== usuario.id) {
      throw new ForbiddenException('Solo puedes eliminar tus propias publicaciones');
    }
    await this.prisma.publicacion.delete({ where: { id } });
    return { mensaje: 'Publicación eliminada' };
  }
}
