import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { EstadoReserva } from '@prisma/client';

export class FiltroReservasDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  equipoId?: string;

  @ApiPropertyOptional({ description: 'Correo del usuario que reservó' })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiPropertyOptional({ enum: EstadoReserva })
  @IsOptional()
  @IsEnum(EstadoReserva)
  estado?: EstadoReserva;

  @ApiPropertyOptional({ description: 'Reservas que inician desde esta fecha', example: '2026-08-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Reservas que inician hasta esta fecha', example: '2026-08-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 10;
}
