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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReservasService } from './reservas.service';
import { CrearReservaDto } from './dto/crear-reserva.dto';
import { FiltroReservasDto } from './dto/filtro-reservas.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-actual.decorator';

@ApiTags('reservas')
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una reserva (requiere autenticación)' })
  @ApiResponse({ status: 401, description: 'Sin token o token inválido' })
  @ApiResponse({ status: 409, description: 'El equipo ya está reservado en esa franja horaria' })
  crear(@Body() dto: CrearReservaDto, @UsuarioActual() usuario: UsuarioAutenticado) {
    return this.reservasService.crear(dto, usuario);
  }

  @Patch(':id/cancelar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar una reserva (solo el dueño o un administrador)' })
  @ApiResponse({ status: 401, description: 'Sin token o token inválido' })
  @ApiResponse({ status: 403, description: 'La reserva pertenece a otro usuario' })
  cancelar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() usuario: UsuarioAutenticado) {
    return this.reservasService.cancelar(id, usuario);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar reservas con paginación y filtros',
    description:
      'Un usuario normal solo ve sus propias reservas; un administrador ve todas y puede filtrar por correo.',
  })
  listar(@Query() filtro: FiltroReservasDto, @UsuarioActual() usuario: UsuarioAutenticado) {
    if (usuario.rol !== 'ADMIN') filtro.correo = usuario.correo;
    return this.reservasService.listar(filtro);
  }
}
