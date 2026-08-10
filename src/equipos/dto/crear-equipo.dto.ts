import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { CategoriaEquipo, EstadoEquipo } from '@prisma/client';

export class CrearEquipoDto {
  @ApiProperty({ example: 'Raspberry Pi 4 Model B' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'B8:27:EB:A4:59:D1', description: 'Número de serie o dirección MAC' })
  @IsString()
  @IsNotEmpty()
  serial: string;

  @ApiProperty({ enum: CategoriaEquipo, example: CategoriaEquipo.MICROCONTROLADORES })
  @IsEnum(CategoriaEquipo)
  categoria: CategoriaEquipo;

  @ApiPropertyOptional({ enum: EstadoEquipo, default: EstadoEquipo.DISPONIBLE })
  @IsOptional()
  @IsEnum(EstadoEquipo)
  estado?: EstadoEquipo;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 23,
    description: 'Hora local (Bogotá) desde la que el equipo se puede usar. Vacío = sin restricción',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(23)
  horaApertura?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 24, description: 'Hora local (Bogotá) límite de uso' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  horaCierre?: number;
}
