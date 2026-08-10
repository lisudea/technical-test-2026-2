import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MascotaService } from './mascota.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-actual.decorator';

export class ActualizarMascotaDto {
  @ApiPropertyOptional({ example: 'Pingu' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ type: [String], example: ['gorro-lana', 'gafas-vr'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  equipados?: string[];
}

export class XpDto {
  @ApiProperty({ example: 30, description: 'Puntos ganados en la partida' })
  @IsInt()
  @Min(0)
  @Max(1000)
  puntos: number;
}

@ApiTags('mascota')
@Controller('mascota')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MascotaController {
  constructor(private readonly mascotaService: MascotaService) {}

  @Get()
  @ApiOperation({ summary: 'Estado de la mascota: nombre, XP, objetos equipados e inventario' })
  obtener(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.mascotaService.obtener(usuario.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Cambiar el nombre o los objetos equipados de la mascota' })
  actualizar(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: ActualizarMascotaDto) {
    return this.mascotaService.actualizar(usuario.id, dto);
  }

  @Post('xp')
  @ApiOperation({ summary: 'Sumar XP tras una partida del mini-juego (con tope anti-trampa)' })
  sumarXp(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: XpDto) {
    return this.mascotaService.sumarXp(usuario.id, dto.puntos);
  }

  @Post('regalo')
  @ApiOperation({ summary: 'Abrir el regalo de bienvenida (una sola vez)' })
  abrirRegalo(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.mascotaService.abrirRegaloBienvenida(usuario.id);
  }
}
