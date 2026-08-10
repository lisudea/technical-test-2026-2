import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('salud')
@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Estado del servicio' })
  estado() {
    return { servicio: 'lis-api', estado: 'ok', docs: '/docs' };
  }

  @Get('salud')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Healthcheck: verifica la conexión a la base de datos',
    description:
      'Ejecuta un SELECT 1. Sirve para monitoreo y para un ping periódico que mantenga despierto el servidor (Render) y la base (Neon).',
  })
  async salud() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { estado: 'ok', bd: 'ok', hora: new Date().toISOString() };
  }
}
