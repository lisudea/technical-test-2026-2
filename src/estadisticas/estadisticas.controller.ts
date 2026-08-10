import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EstadisticasService } from './estadisticas.service';

@ApiTags('estadisticas')
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get('resumen')
  @ApiOperation({
    summary: 'KPIs generales del laboratorio',
    description:
      'Totales de equipos por estado y categoría, actividad de reservas, ocupación actual y usuarios más frecuentes. Pensado para alimentar un dashboard.',
  })
  resumen() {
    return this.estadisticasService.resumen();
  }

  @Get('top-equipos')
  @ApiOperation({ summary: 'Equipos más solicitados históricamente' })
  @ApiQuery({ name: 'limite', required: false, example: 5 })
  topEquipos(@Query('limite', new ParseIntPipe({ optional: true })) limite?: number) {
    return this.estadisticasService.topEquipos(limite ?? 5);
  }
}
