import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { EquiposService } from './equipos.service';
import { CrearEquipoDto } from './dto/crear-equipo.dto';
import { ActualizarEquipoDto } from './dto/actualizar-equipo.dto';
import { FiltroEquiposDto } from './dto/filtro-equipos.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-actual.decorator';

@ApiTags('equipos')
@Controller('equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un equipo (solo administradores)' })
  @ApiResponse({ status: 403, description: 'Requiere rol de administrador' })
  crear(@Body() dto: CrearEquipoDto, @UsuarioActual() usuario: UsuarioAutenticado) {
    return this.equiposService.crear(dto, usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Listar equipos con paginación y filtros' })
  listar(@Query() filtro: FiltroEquiposDto) {
    return this.equiposService.listar(filtro);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un equipo' })
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.equiposService.obtener(id);
  }

  @Get(':id/disponibilidad')
  @ApiOperation({
    summary: 'Franjas ocupadas de un equipo',
    description:
      'Devuelve solo las franjas (inicio y fin) de las reservas activas en el rango, sin datos personales. Público, pensado para el selector de horarios.',
  })
  @ApiQuery({ name: 'desde', required: true, example: '2026-08-10T00:00:00Z' })
  @ApiQuery({ name: 'hasta', required: true, example: '2026-08-10T23:59:59Z' })
  disponibilidad(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.equiposService.disponibilidad(id, new Date(desde), new Date(hasta));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un equipo (solo administradores)' })
  @ApiResponse({ status: 403, description: 'Requiere rol de administrador' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarEquipoDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return this.equiposService.actualizar(id, dto, usuario);
  }
}
