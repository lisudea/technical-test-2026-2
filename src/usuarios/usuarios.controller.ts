import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-actual.decorator';

export class CambiarRolDto {
  @ApiProperty({ enum: Rol })
  @IsEnum(Rol)
  rol: Rol;
}

@ApiTags('usuarios')
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN)
@ApiBearerAuth()
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios (solo administradores)' })
  @ApiQuery({ name: 'buscar', required: false })
  @ApiQuery({ name: 'pagina', required: false })
  @ApiQuery({ name: 'limite', required: false })
  listar(
    @Query('buscar') buscar?: string,
    @Query('pagina', new ParseIntPipe({ optional: true })) pagina?: number,
    @Query('limite', new ParseIntPipe({ optional: true })) limite?: number,
  ) {
    return this.usuariosService.listar(buscar, pagina ?? 1, limite ?? 10);
  }

  @Patch(':id/rol')
  @ApiOperation({ summary: 'Cambiar el rol de un usuario (solo administradores)' })
  @ApiResponse({ status: 400, description: 'No puedes cambiar tu propio rol' })
  cambiarRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarRolDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return this.usuariosService.cambiarRol(id, dto.rol, usuario);
  }
}
