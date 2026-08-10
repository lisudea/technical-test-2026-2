import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
}
