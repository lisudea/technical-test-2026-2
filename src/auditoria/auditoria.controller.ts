import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

export class FiltroAuditoriaDto {
  @ApiPropertyOptional({ description: 'EQUIPO_CREADO, EQUIPO_ACTUALIZADO, ROL_CAMBIADO, RESERVA_CREADA, RESERVA_CANCELADA' })
  @IsOptional()
  @IsString()
  accion?: string;

  @ApiPropertyOptional({ description: 'equipo, usuario o reserva' })
  @IsOptional()
  @IsString()
  entidad?: string;

  @ApiPropertyOptional({ description: 'Busca en actor y detalle' })
  @IsOptional()
  @IsString()
  buscar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 15;
}

@ApiTags('auditoria')
@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN)
@ApiBearerAuth()
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @ApiOperation({ summary: 'Registro de actividad administrativa (solo administradores)' })
  listar(@Query() filtro: FiltroAuditoriaDto) {
    return this.auditoriaService.listar(filtro);
  }
}
